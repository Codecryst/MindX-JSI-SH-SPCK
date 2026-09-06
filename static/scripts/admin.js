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
} from './firebase-config.js';

// ---------- Login check part ----------
const accessLine = document.getElementById('accessLine');
const adminGreeting = document.getElementById('adminGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const restrictedBanner = document.getElementById('restrictedBanner');
const usersTableBody = document.getElementById('usersTableBody');
const recentList = document.getElementById('recentList');
const statUsers = document.getElementById('statUsers');
const statEntries = document.getElementById('statEntries');
const statWriters = document.getElementById('statWriters');
const statToday = document.getElementById('statToday');
const refreshBtn = document.getElementById('refreshBtn');

let isAdmin = false; // becomes true only when the role is admin
let allUsers = []; // every account from the "users" collection
let allEntries = []; // every entry from the "userUsage" collection
let currentUid = null; // uid of the admin who is logged in now

// Simple student-level helper: accept the common ways a role can be stored.
// Accepts "admin" and "administrator", any case, from roleId / role / userRole / isAdmin.
function getRoleText(data) {
  if (data === null || data === undefined) {
    return 'customer';
  }
  let raw = data.roleId;
  if (raw === undefined || raw === null || raw === '') {
    raw = data.role;
  }
  if (raw === undefined || raw === null || raw === '') {
    raw = data.userRole;
  }
  if ((raw === undefined || raw === null || raw === '') && data.isAdmin === true) {
    return 'admin';
  }
  if (typeof raw !== 'string') {
    return 'customer';
  }
  return raw.trim().toLowerCase();
}

function isAdminRole(roleText) {
  return roleText === 'admin' || roleText === 'administrator';
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
  let role = 'customer';
  let profileFound = false;
  try {
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    if (snapshot.exists()) {
      profileFound = true;
      const data = snapshot.data();
      if (data.displayName) {
        name = data.displayName;
      }
      role = getRoleText(data);
    }
  } catch (error) {
    console.log('Cannot read the profile:', error);
  }

  adminGreeting.textContent = name;

  // Missing profile -> explain instead of a plain "regular user" message
  if (profileFound === false) {
    showDeniedView(name, 'missing profile');
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

  statUsers.textContent = '\u2014';
  statEntries.textContent = '\u2014';
  statWriters.textContent = '\u2014';
  statToday.textContent = '\u2014';

  usersTableBody.innerHTML =
    '<tr><td colspan="6" class="text-danger">Admin access required to see users.</td></tr>';
  recentList.innerHTML = '<p class="text-danger small">Admin access required to see entries.</p>';
}

// ---------- Data loading part ----------
// Reload the table and the stats from Firestore
async function loadAdminData() {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const entriesSnapshot = await getDocs(collection(db, 'userUsage'));

  allUsers = [];
  usersSnapshot.forEach(function (oneDoc) {
    const data = oneDoc.data();
    allUsers.push({
      id: oneDoc.id,
      uid: data.uid || oneDoc.id,
      email: data.email,
      displayName: data.displayName,
      roleId: getRoleText(data),
      createdAt: data.createdAt || null,
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

  renderStats();
  renderUsersTable();
  renderRecentEntries();
}

// If Firebase refuses to load (rules / offline), show a friendly message
function showLoadError() {
  usersTableBody.innerHTML =
    '<tr><td colspan="6" class="text-danger">Could not load users. Check Firestore rules allow admin to read the users and userUsage collections, and check your connection.</td></tr>';
  recentList.innerHTML =
    '<p class="text-danger small">Could not load entries. Check Firestore rules and your connection.</p>';
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
  const writerIds = {};
  allEntries.forEach(function (entry) {
    if (entry.uid) {
      writerIds[entry.uid] = true;
    }
  });
  statWriters.textContent = Object.keys(writerIds).length;

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
    const nameA = (a.displayName || a.email || '').toLowerCase();
    const nameB = (b.displayName || b.email || '').toLowerCase();
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });

  sortedUsers.forEach(function (userRecord, index) {
    const row = document.createElement('tr');

    const numberCell = document.createElement('td');
    numberCell.textContent = index + 1;

    const nameCell = document.createElement('td');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = userRecord.displayName || 'Unnamed user';
    nameStrong.style.cursor = 'pointer';
    nameStrong.style.textDecoration = 'underline';
    nameStrong.title = 'Click to view user fields';
    nameStrong.addEventListener('click', function () {
      openViewUser(userRecord);
    });
    nameCell.appendChild(nameStrong);

    const emailCell = document.createElement('td');
    emailCell.textContent = userRecord.email || '';
    emailCell.className = 'text-muted';

    const roleCell = document.createElement('td');
    roleCell.textContent = userRecord.roleId || 'customer';

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

    const deleteUserBtn = document.createElement('button');
    deleteUserBtn.type = 'button';
    deleteUserBtn.className = 'btn btn-danger btn-sm';
    deleteUserBtn.textContent = 'Delete';
    // Student rule: never delete an admin account, including your own.
    if (isAdminRole(userRecord.roleId)) {
      deleteUserBtn.disabled = true;
      deleteUserBtn.title = 'Admin accounts cannot be deleted.';
    } else {
      deleteUserBtn.addEventListener('click', function () {
        deleteUser(userRecord);
      });
    }

    actionsCell.appendChild(viewUserBtn);
    actionsCell.appendChild(editUserBtn);
    actionsCell.appendChild(deleteUserBtn);

    row.appendChild(numberCell);
    row.appendChild(nameCell);
    row.appendChild(emailCell);
    row.appendChild(roleCell);
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
    title.textContent = entry.header === '' || entry.header === undefined ? 'Untitled' : entry.header;

    const meta = document.createElement('span');
    meta.className = 'journal-item-date';
    const createdDate = entryTime(entry) === 0 ? null : new Date(entryTime(entry));
    meta.textContent = (author ? author + ' \u2014 ' : '') + (createdDate === null ? 'Unknown date' : createdDate.toLocaleString());

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

// Look up the display name of the owner of an entry
function findAuthorName(uid) {
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].id === uid) {
      return allUsers[i].displayName || allUsers[i].email;
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

// Simple student-level date text: Firestore Timestamp -> local string
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
  viewUserId.textContent = userRecord.id || '-';
  viewUserUid.textContent = userRecord.uid || '-';
  viewUserName.textContent = userRecord.displayName || '-';
  viewUserEmail.textContent = userRecord.email || '-';
  viewUserRole.textContent = userRecord.roleId || 'customer';
  viewUserCreated.textContent = fieldDateText(userRecord.createdAt);
  viewUserEntries.textContent = countEntriesForUser(userRecord.id);
  viewUserModal.show();
}

// ---------- Edit / delete users ----------
const editUserModalEl = document.getElementById('editUserModal');
const editUserName = document.getElementById('editUserName');
const editUserEmail = document.getElementById('editUserEmail');
const editUserRole = document.getElementById('editUserRole');
const saveUserBtn = document.getElementById('saveUserBtn');

let editingUserId = null; // id of the user document being edited

const userModal = new bootstrap.Modal(editUserModalEl);

function openEditUser(userRecord) {
  editingUserId = userRecord.id;
  editUserName.value = userRecord.displayName || '';
  editUserEmail.value = userRecord.email || '';
  editUserRole.value = isAdminRole(userRecord.roleId) ? 'admin' : 'customer';
  userModal.show();
}

saveUserBtn.addEventListener('click', async function () {
  if (editingUserId === null) {
    return;
  }

  const newName = editUserName.value.trim();
  const newRole = editUserRole.value;

  if (newName === '') {
    alert('Display name cannot be empty.');
    return;
  }
  if (newName.length > 20) {
    alert('Display name must be 20 characters or less.');
    return;
  }

  // Same rule as delete: do not demote an admin, or it could be deleted after.
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].id === editingUserId && isAdminRole(allUsers[i].roleId) && isAdminRole(newRole) === false) {
      alert('Cannot change this user because it is an admin account.');
      return;
    }
  }

  try {
    await updateDoc(doc(db, 'users', editingUserId), {
      displayName: newName,
      roleId: newRole,
    });

    userModal.hide();
    await loadAdminData();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not save the user. Check Firestore rules.');
  }
});

// Remove a user profile together with all of their entries
// Rule: admin accounts cannot be deleted, not even by another admin.
async function deleteUser(userRecord) {
  if (isAdminRole(userRecord.roleId)) {
    alert('Cannot delete this user because it is an admin account.');
    return;
  }
  if (userRecord.id === currentUid) {
    alert('Cannot delete your own admin account while you are logged in.');
    return;
  }
  const confirmed = confirm('Delete this user? All of their entries will also be removed.');
  if (confirmed === false) {
    return;
  }

  try {
    // Remove every entry that belongs to this user first
    for (let i = 0; i < allEntries.length; i++) {
      if (allEntries[i].uid === userRecord.id) {
        await deleteDoc(doc(db, 'userUsage', allEntries[i].id));
      }
    }

    // Then remove the user profile document
    await deleteDoc(doc(db, 'users', userRecord.id));

    await loadAdminData();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not delete the user. Check Firestore rules.');
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
      editEntryHeader.value = allEntries[i].header || '';
      editEntryContent.value = allEntries[i].content || '';
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