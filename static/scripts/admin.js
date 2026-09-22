import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  signOut,
  query,
  orderBy,
} from './firebase-config.js';

// ---------- Login check part ----------
const accessLine = document.getElementById('accessLine');
const adminGreeting = document.getElementById('adminGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const restrictedBanner = document.getElementById('restrictedBanner');
const usersTableBody = document.getElementById('usersTableBody');
const recentList = document.getElementById('recentList');
const feedbackTableBody = document.getElementById('feedbackTableBody');
const statUsers = document.getElementById('statUsers');
const statEntries = document.getElementById('statEntries');
const statWriters = document.getElementById('statWriters');
const statToday = document.getElementById('statToday');
const refreshBtn = document.getElementById('refreshBtn');

let isAdmin = false; // becomes true only when the role is admin
let allUsers = []; // every account from the "users" collection
let allEntries = []; // every entry from the "userUsage" collection
let allFeedback = []; // every feedback from the "feedback" collection
let currentUid = null; // uid of the admin who is logged in now

// Tiny helper: true only when a value is real text (not empty, not missing).
// Returns false for undefined, null, or empty string, else true.
function hasText(value) {
  // Empty or missing means no real text.
  if (value === undefined || value === null || value === '') {
    return false;
  }
  // Spaces only is also no real text.
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  return true;
}

// A user is roleId "user".
function getRoleText(data) {
  // Step 1: no profile data means user.
  if (hasText(data) === false) {
    return 'user';
  }
  // Step 2: read only the roleId field.
  let raw = data.roleId;
  // Step 3: only text can be a role, else user.
  if (typeof raw !== 'string') {
    return 'user';
  }
  return raw.trim().toLowerCase();
}

function isAdminRole(roleText) {
  return roleText === 'admin' || roleText === 'administrator';
}

function isUserRole(roleText) {
  return roleText === 'user';
}

// If the admin is not logged in -> send them back to login.html
onAuthStateChanged(auth, async function (user) {
  if (user === null) {
    window.location.href = 'login.html';
    return;
  }

  currentUid = user.uid;

  // Read the current account profile so we can check the role
  let name = user.email;
  let role = 'user';
  let profileFound = false;
  try {
    // profileDoc is the user profile document loaded from Firebase.
    const profileDoc = await getDoc(doc(db, 'users', user.uid));
    if (profileDoc.exists()) {
      profileFound = true;
      const data = profileDoc.data();
      if (data.displayName) {
        name = data.displayName;
      }
      role = getRoleText(data);
    }
  } catch (error) {
    console.log('Cannot read the profile:', error);
  }

  adminGreeting.textContent = name;

  // Glitch means Auth exists but no users doc, so treat as logged out.
  if (profileFound === false) {
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Cannot sign out:', error);
    }
    window.location.href = 'login.html';
    return;
  }

  // Only admin accounts can use the control dashboard
  if (isAdminRole(role) === false) {
    showDeniedView(name, role);
    return;
  }

  isAdmin = true;
  accessLine.textContent = 'Full admin access. You can read and edit all user data.';

  try {
    await loadAdminData();
  } catch (error) {
    console.log('Cannot load admin data:', error);
    showLoadError();
  }
});

// Logout button -> end the session and go back to the landing page
logoutBtn.addEventListener('click', async function () {
  try {
    await signOut(auth);
  } catch (error) {
    console.log(error);
  }
  window.location.href = 'index.html';
});

// Block the dashboard for regular users
function showDeniedView(name, role) {
  restrictedBanner.textContent =
    'Access denied: this control dashboard is for admins only. Your account "' +
    name +
    '" has role "' +
    role +
    '". To fix it, open Firestore -> users -> your uid and set roleId to "admin", then reload.';
  restrictedBanner.className = 'message-box show error';
  accessLine.textContent = 'Only admin accounts can view and change user data. Your display name is not your role.';

  // Hidden until admin access: show a plain dash instead of numbers.
  statUsers.textContent = '-';
  statEntries.textContent = '-';
  statWriters.textContent = '-';
  statToday.textContent = '-';

  usersTableBody.innerHTML =
    '<tr><td colspan="6" class="text-danger">Admin access required to see users.</td></tr>';
  recentList.innerHTML = '<p class="text-danger small">Admin access required to see entries.</p>';
}

// ---------- Data loading part ----------
// Reload the table and the stats from Firestore
async function loadAdminData() {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const entriesSnapshot = await getDocs(collection(db, 'userUsage'));
  const feedbackSnapshot = await getDocs(query(collection(db, 'feedback'), orderBy('severity', 'desc')));

  allUsers = [];
  usersSnapshot.forEach(function (oneDoc) {
    const data = oneDoc.data();
    let userUid = oneDoc.id;
    // Use the stored uid only when it has real text.
    if (hasText(data.uid)) {
      userUid = data.uid;
    }
    let userCreatedAt = null;
    // Keep the stored date only when it has a real value.
    if (hasText(data.createdAt)) {
      userCreatedAt = data.createdAt;
    }
    allUsers.push({
      id: oneDoc.id,
      uid: userUid,
      email: data.email,
      displayName: data.displayName,
      roleId: getRoleText(data),
      createdAt: userCreatedAt,
      deactivated: data.deactivated === true,
    });
  });

  allEntries = [];
  entriesSnapshot.forEach(function (oneDoc) {
    const data = oneDoc.data();
    allEntries.push({
      id: oneDoc.id,
      uid: data.uid,
      header: data.header,
      content: data.content,
      createdAt: data.createdAt,
    });
  });

  allFeedback = [];
  feedbackSnapshot.forEach(function (oneDoc) {
    const data = oneDoc.data();
    allFeedback.push({
      id: oneDoc.id,
      email: data.email,
      title: data.title,
      content: data.content,
      severity: data.severity,
      createdAt: data.createdAt,
    });
  });

  renderStats();
  renderUsersTable();
  renderRecentEntries();
  renderFeedback();
}

// If Firebase refuses to load (rules / offline), show a friendly message
function showLoadError() {
  usersTableBody.innerHTML =
    '<tr><td colspan="6" class="text-danger">Could not load users. Check Firestore rules allow admin to read the users and userUsage collections, and check your connection.</td></tr>';
  recentList.innerHTML =
    '<p class="text-danger small">Could not load entries. Check Firestore rules and your connection.</p>';
  if (feedbackTableBody) {
    feedbackTableBody.innerHTML =
      '<tr><td colspan="6" class="text-danger">Could not load feedback. Check Firestore rules and your connection.</td></tr>';
  }
  statUsers.textContent = '0';
  statEntries.textContent = '0';
  statWriters.textContent = '0';
  statToday.textContent = '0';
}

refreshBtn.addEventListener('click', async function () {
  if (isAdmin === false) {
    return;
  }
  try {
    await loadAdminData();
  } catch (error) {
    console.log(error);
    showLoadError();
  }
});

// Turn the timestamp field into a JS date in milliseconds
function entryTime(entry) {
  if (entry.createdAt && typeof entry.createdAt.toDate === 'function') {
    return entry.createdAt.toDate().getTime();
  }
  return 0;
}

// ---------- Stats part ----------
function renderStats() {
  statUsers.textContent = allUsers.length;
  statEntries.textContent = allEntries.length;

  // Count how many different users wrote at least one entry
  const writerIds = [];
  for (let i = 0; i < allEntries.length; i++) {
    const writerUid = allEntries[i].uid;
    // Count it only when the writer id has real text.
    if (hasText(writerUid)) {
      if (writerIds.includes(writerUid) === false) {
        writerIds.push(writerUid);
      }
    }
  }
  statWriters.textContent = writerIds.length;

  // Count entries created on the current local day
  const today = new Date().toLocaleDateString();
  let todayCount = 0;
  allEntries.forEach(function (entry) {
    if (entry.createdAt && typeof entry.createdAt.toDate === 'function') {
      const created = entry.createdAt.toDate();
      if (created.toLocaleDateString() === today) {
        todayCount = todayCount + 1;
      }
    }
  });
  statToday.textContent = todayCount;
}

// Count how many entries belong to one user id
function countEntriesForUser(uid) {
  let count = 0;
  for (let i = 0; i < allEntries.length; i++) {
    if (allEntries[i].uid === uid) {
      count = count + 1;
    }
  }
  return count;
}

// Pick the name used for sorting: displayName first, then email, else empty text.
function getSortName(userRecord) {
  // Step 1: use displayName when it has real text.
  if (hasText(userRecord.displayName)) {
    return userRecord.displayName;
  }
  // Step 2: fall back to email when displayName is empty.
  if (hasText(userRecord.email)) {
    return userRecord.email;
  }
  // Step 3: no name at all, so sort as empty text.
  return '';
}

// ---------- Users table part ----------
function renderUsersTable() {
  usersTableBody.innerHTML = '';

  if (allUsers.length === 0) {
    const empty = document.createElement('tr');
    empty.innerHTML = '<td colspan="6" class="text-muted">No registered users yet.</td>';
    usersTableBody.appendChild(empty);
    return;
  }

  // Simple alphabetical order by name
  const sortedUsers = allUsers.slice().sort(function (a, b) {
    const nameA = getSortName(a).toLowerCase();
    const nameB = getSortName(b).toLowerCase();
    // The sort function returns -1 when A comes first.
    if (nameA < nameB) {
      return -1;
    }
    // It returns 1 when B comes first.
    if (nameA > nameB) {
      return 1;
    }
    // It returns 0 when both names are equal.
    return 0;
  });

  sortedUsers.forEach(function (userRecord, index) {
    const row = document.createElement('tr');

    const numberCell = document.createElement('td');
    numberCell.textContent = index + 1;

    const nameCell = document.createElement('td');
    const nameStrong = document.createElement('strong');
    let showName = 'Unnamed user';
    // Use the display name only when it has real text.
    if (hasText(userRecord.displayName)) {
      showName = userRecord.displayName;
    }
    nameStrong.textContent = showName;
    nameStrong.style.cursor = 'pointer';
    nameStrong.style.textDecoration = 'underline';
    nameStrong.title = 'Click to view user fields';
    nameStrong.addEventListener('click', function () {
      openViewUser(userRecord);
    });
    nameCell.appendChild(nameStrong);

    const emailCell = document.createElement('td');
    let showEmail = '';
    // Use the email only when it has real text.
    if (hasText(userRecord.email)) {
      showEmail = userRecord.email;
    }
    emailCell.textContent = showEmail;
    emailCell.className = 'text-muted';

    const roleCell = document.createElement('td');
    let showRole = 'user';
    // Use the stored role only when it has real text.
    if (hasText(userRecord.roleId)) {
      showRole = userRecord.roleId;
    }
    roleCell.textContent = showRole;

    const statusCell = document.createElement('td');
    if (userRecord.deactivated === true) {
      const badge = document.createElement('span');
      badge.className = 'badge bg-danger';
      badge.textContent = 'Deactivated';
      statusCell.appendChild(badge);
    } else {
      const badge = document.createElement('span');
      badge.className = 'badge bg-success';
      badge.textContent = 'Active';
      statusCell.appendChild(badge);
    }

    const entriesCell = document.createElement('td');
    entriesCell.className = 'text-end';
    entriesCell.textContent = countEntriesForUser(userRecord.id);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'text-end';

    const editUserBtn = document.createElement('button');
    editUserBtn.type = 'button';
    editUserBtn.className = 'btn btn-outline-secondary btn-sm me-1';
    editUserBtn.textContent = 'Edit';
    editUserBtn.addEventListener('click', function () {
      openEditUser(userRecord);
    });

    const viewUserBtn = document.createElement('button');
    viewUserBtn.type = 'button';
    viewUserBtn.className = 'btn btn-outline-dark btn-sm me-1';
    viewUserBtn.textContent = 'View';
    viewUserBtn.addEventListener('click', function () {
      openViewUser(userRecord);
    });

    const deactivateUserBtn = document.createElement('button');
    deactivateUserBtn.type = 'button';
    deactivateUserBtn.className = 'btn btn-danger btn-sm';
    deactivateUserBtn.textContent = 'Deactivate';
    // Admin accounts cannot be deactivated. Deactivated users get a Reactivate button.
    if (isAdminRole(userRecord.roleId)) {
      deactivateUserBtn.disabled = true;
      deactivateUserBtn.title = 'Admin accounts cannot be deactivated.';
    } else if (userRecord.deactivated === true) {
      deactivateUserBtn.className = 'btn btn-success btn-sm';
      deactivateUserBtn.textContent = 'Reactivate';
      deactivateUserBtn.addEventListener('click', function () {
        reactivateUser(userRecord);
      });
    } else {
      deactivateUserBtn.addEventListener('click', function () {
        deactivateUser(userRecord);
      });
    }

    actionsCell.appendChild(viewUserBtn);
    actionsCell.appendChild(editUserBtn);
    actionsCell.appendChild(deactivateUserBtn);

    row.appendChild(numberCell);
    row.appendChild(nameCell);
    row.appendChild(emailCell);
    row.appendChild(roleCell);
    row.appendChild(statusCell);
    row.appendChild(entriesCell);
    row.appendChild(actionsCell);

    usersTableBody.appendChild(row);
  });
}

// ---------- Recent entries part ----------
function renderRecentEntries() {
  recentList.innerHTML = '';

  if (allEntries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted small';
    empty.textContent = 'No entries have been written yet.';
    recentList.appendChild(empty);
    return;
  }

  // Newest first, show only the six most recent ones
  const newest = allEntries.slice().sort(function (a, b) {
    return entryTime(b) - entryTime(a);
  });
  newest.slice(0, 6).forEach(function (entry) {
    const author = findAuthorName(entry.uid);

    const item = document.createElement('div');
    item.className = 'recent-item';

    const main = document.createElement('div');
    main.className = 'recent-item-main';

    const title = document.createElement('h5');
    title.className = 'journal-item-title';
    let titleText = 'Untitled';
    // Use the entry header only when it has real text.
    if (hasText(entry.header)) {
      titleText = entry.header;
    }
    title.textContent = titleText;

    const meta = document.createElement('span');
    meta.className = 'journal-item-date';
    let createdDate = null;
    if (entryTime(entry) !== 0) {
      createdDate = new Date(entryTime(entry));
    }
    let metaText = '';
    // Show the author name only when it has real text.
    if (hasText(author)) {
      metaText = author + ' - ';
    }
    if (createdDate === null) {
      metaText = metaText + 'Unknown date';
    } else {
      metaText = metaText + createdDate.toLocaleString();
    }
    meta.textContent = metaText;

    main.appendChild(title);
    main.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'recent-item-actions';

    const editEntryBtn = document.createElement('button');
    editEntryBtn.type = 'button';
    editEntryBtn.className = 'btn btn-outline-secondary btn-sm me-1';
    editEntryBtn.textContent = 'Edit';
    editEntryBtn.addEventListener('click', function () {
      openEditEntry(entry.id);
    });

    const deleteEntryBtn = document.createElement('button');
    deleteEntryBtn.type = 'button';
    deleteEntryBtn.className = 'btn btn-danger btn-sm';
    deleteEntryBtn.textContent = 'Delete';
    deleteEntryBtn.addEventListener('click', function () {
      deleteEntry(entry.id);
    });

    actions.appendChild(editEntryBtn);
    actions.appendChild(deleteEntryBtn);

    item.appendChild(main);
    item.appendChild(actions);
    recentList.appendChild(item);
  });
}

// ---------- Feedback part ----------
function renderFeedback() {
  if (!feedbackTableBody) return;
  feedbackTableBody.innerHTML = '';

  if (allFeedback.length === 0) {
    const empty = document.createElement('tr');
    empty.innerHTML = '<td colspan="6" class="text-muted">No feedback submitted yet.</td>';
    feedbackTableBody.appendChild(empty);
    return;
  }

  allFeedback.forEach(function (fb, index) {
    const row = document.createElement('tr');

    const numberCell = document.createElement('td');
    numberCell.textContent = index + 1;

    const titleCell = document.createElement('td');
    titleCell.textContent = fb.title || '-';

    const emailCell = document.createElement('td');
    emailCell.textContent = fb.email || '-';
    emailCell.className = 'text-muted';

    const severityCell = document.createElement('td');
    severityCell.className = 'text-center';
    const badge = document.createElement('span');
    badge.className = 'badge';
    if (fb.severity >= 8) badge.classList.add('bg-danger');
    else if (fb.severity >= 5) badge.classList.add('bg-warning');
    else badge.classList.add('bg-info');
    badge.textContent = fb.severity + '/10';
    severityCell.appendChild(badge);

    const dateCell = document.createElement('td');
    if (fb.createdAt && typeof fb.createdAt.toDate === 'function') {
      dateCell.textContent = fb.createdAt.toDate().toLocaleString();
    } else {
      dateCell.textContent = '-';
    }

    const contentCell = document.createElement('td');
    contentCell.textContent = fb.content || '-';
    contentCell.style.maxWidth = '300px';
    contentCell.style.whiteSpace = 'nowrap';
    contentCell.style.overflow = 'hidden';
    contentCell.style.textOverflow = 'ellipsis';

    row.appendChild(numberCell);
    row.appendChild(titleCell);
    row.appendChild(emailCell);
    row.appendChild(severityCell);
    row.appendChild(dateCell);
    row.appendChild(contentCell);

    feedbackTableBody.appendChild(row);
  });
}

// Look up the display name of the owner of an entry
function findAuthorName(uid) {
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].id === uid) {
      // Use the display name when it has real text.
      if (hasText(allUsers[i].displayName)) {
        return allUsers[i].displayName;
      }
      // Fall back to the email when the name is empty.
      if (hasText(allUsers[i].email)) {
        return allUsers[i].email;
      }
      return null;
    }
  }
  return null;
}

// ---------- View user details ----------
const viewUserModalEl = document.getElementById('viewUserModal');
const viewUserId = document.getElementById('viewUserId');
const viewUserUid = document.getElementById('viewUserUid');
const viewUserName = document.getElementById('viewUserName');
const viewUserEmail = document.getElementById('viewUserEmail');
const viewUserRole = document.getElementById('viewUserRole');
const viewUserCreated = document.getElementById('viewUserCreated');
const viewUserEntries = document.getElementById('viewUserEntries');

const viewUserModal = new bootstrap.Modal(viewUserModalEl);

// Date text: Firestore Timestamp -> local string
function fieldDateText(value) {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }
  return String(value);
}

function openViewUser(userRecord) {
  let viewIdText = '-';
  // Show the id only when it has real text.
  if (hasText(userRecord.id)) {
    viewIdText = userRecord.id;
  }
  viewUserId.textContent = viewIdText;
  let viewUidText = '-';
  // Show the uid only when it has real text.
  if (hasText(userRecord.uid)) {
    viewUidText = userRecord.uid;
  }
  viewUserUid.textContent = viewUidText;
  let viewNameText = '-';
  // Show the display name only when it has real text.
  if (hasText(userRecord.displayName)) {
    viewNameText = userRecord.displayName;
  }
  viewUserName.textContent = viewNameText;
  let viewEmailText = '-';
  // Show the email only when it has real text.
  if (hasText(userRecord.email)) {
    viewEmailText = userRecord.email;
  }
  viewUserEmail.textContent = viewEmailText;
  let viewRoleText = 'user';
  // Show the role only when it has real text.
  if (hasText(userRecord.roleId)) {
    viewRoleText = userRecord.roleId;
  }
  viewUserRole.textContent = viewRoleText;
  viewUserCreated.textContent = fieldDateText(userRecord.createdAt);
  viewUserEntries.textContent = countEntriesForUser(userRecord.id);
  // Show deactivated status
  const viewUserDeactivated = document.getElementById('viewUserDeactivated');
  if (viewUserDeactivated) {
    if (userRecord.deactivated === true) {
      viewUserDeactivated.innerHTML = '<span class="badge bg-danger">Deactivated</span>';
    } else {
      viewUserDeactivated.innerHTML = '<span class="badge bg-success">Active</span>';
    }
  }
  viewUserModal.show();
}

// ---------- Edit / delete users ----------
const editUserModalEl = document.getElementById('editUserModal');
const editUserName = document.getElementById('editUserName');
const editUserEmail = document.getElementById('editUserEmail');
const saveUserBtn = document.getElementById('saveUserBtn');

let editingUserId = null; // id of the user document being edited

const userModal = new bootstrap.Modal(editUserModalEl);

function openEditUser(userRecord) {
  editingUserId = userRecord.id;
  let editNameText = '';
  // Fill the name box only when the stored name has real text.
  if (hasText(userRecord.displayName)) {
    editNameText = userRecord.displayName;
  }
  editUserName.value = editNameText;
  let editEmailText = '';
  // Fill the email box only when the stored email has real text.
  if (hasText(userRecord.email)) {
    editEmailText = userRecord.email;
  }
  editUserEmail.value = editEmailText;
  userModal.show();
}

saveUserBtn.addEventListener('click', async function () {
  if (editingUserId === null) {
    return;
  }

  const newName = editUserName.value.trim();

  if (newName === '') {
    alert('Display name cannot be empty.');
    return;
  }
  if (newName.length > 20) {
    alert('Display name must be 20 characters or less.');
    return;
  }

  try {
    await updateDoc(doc(db, 'users', editingUserId), {
      displayName: newName,
    });

    userModal.hide();
    await loadAdminData();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not save the user. Check Firestore rules.');
  }
});

// Deactivate a user (sets deactivated: true instead of deleting)
async function deactivateUser(userRecord) {
  if (isAdminRole(userRecord.roleId)) {
    alert('Cannot deactivate this user because it is an admin account.');
    return;
  }
  if (userRecord.id === currentUid) {
    alert('Cannot deactivate your own admin account while you are logged in.');
    return;
  }
  const confirmed = confirm('Deactivate this user? They will not be able to access their journal.');
  if (confirmed === false) {
    return;
  }

  try {
    await updateDoc(doc(db, 'users', userRecord.id), {
      deactivated: true,
    });

    await loadAdminData();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not deactivate the user. Check Firestore rules.');
  }
}

// Reactivate a user (sets deactivated: false so they can use the journal again)
async function reactivateUser(userRecord) {
  const confirmed = confirm('Reactivate this user? They will be able to access their journal again.');
  if (confirmed === false) {
    return;
  }

  try {
    await updateDoc(doc(db, 'users', userRecord.id), {
      deactivated: false,
    });

    await loadAdminData();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not reactivate the user. Check Firestore rules.');
  }
}

// ---------- Edit / delete entries ----------
const editEntryModalEl = document.getElementById('editEntryModal');
const editEntryHeader = document.getElementById('editEntryHeader');
const editEntryContent = document.getElementById('editEntryContent');
const saveEntryBtn = document.getElementById('saveEntryBtn');

let editingEntryId = null; // id of the entry document being edited

const entryModal = new bootstrap.Modal(editEntryModalEl);

function openEditEntry(id) {
  for (let i = 0; i < allEntries.length; i++) {
    if (allEntries[i].id === id) {
      editingEntryId = id;
      let editHeaderText = '';
      // Fill the header box only when the stored header has real text.
      if (hasText(allEntries[i].header)) {
        editHeaderText = allEntries[i].header;
      }
      editEntryHeader.value = editHeaderText;
      let editContentText = '';
      // Fill the content box only when the stored content has real text.
      if (hasText(allEntries[i].content)) {
        editContentText = allEntries[i].content;
      }
      editEntryContent.value = editContentText;
      break;
    }
  }
  entryModal.show();
}

saveEntryBtn.addEventListener('click', async function () {
  if (editingEntryId === null) {
    return;
  }

  const newHeader = editEntryHeader.value.trim();
  const newContent = editEntryContent.value.trim();

  if (newHeader === '' && newContent === '') {
    alert('Please leave at least a header or some content.');
    return;
  }

  try {
    await updateDoc(doc(db, 'userUsage', editingEntryId), {
      header: newHeader,
      content: newContent,
    });

    entryModal.hide();
    await loadAdminData();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not save the entry. Check Firestore rules.');
  }
});

// Remove one entry document
async function deleteEntry(id) {
  const confirmed = confirm('Delete this entry?');
  if (confirmed === false) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'userUsage', id));
    await loadAdminData();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not delete the entry. Check Firestore rules.');
  }
}