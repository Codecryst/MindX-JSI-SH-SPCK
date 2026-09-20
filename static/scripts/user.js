import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from './firebase-config.js';

// ---------- Account part ----------
const accountAvatar = document.getElementById('accountAvatar');
const accountName = document.getElementById('accountName');
const dashboardLink = document.getElementById('dashboardLink');
const logoutBtn = document.getElementById('logoutBtn');

// Logout button next to the account -> end session and go to index
if (logoutBtn !== null) {
  logoutBtn.addEventListener('click', async function () {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
    window.location.href = 'index.html';
  });
}

let currentUserId = null; // will be filled after login check

// A user is roleId "user".
function getRoleText(data) {
  // Step 1: no profile data means user.
  if (data === null || data === undefined) {
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

// Check if the user is logged in.
// If not logged in -> send them back to login.html
onAuthStateChanged(auth, async function (user) {
  if (user === null) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = user.uid;

  // Read the user profile from Firestore to show the display name
  let name = user.email;
  try {
    const profileDoc = await getDoc(doc(db, 'users', user.uid));
    if (!profileDoc.exists()) {
      // Glitch means Auth exists but no users doc, so treat as logged out.
      try {
        await signOut(auth);
      } catch (error) {
        console.log(error);
      }
      window.location.href = 'login.html';
      return;
    }
    const data = profileDoc.data();
    if (data.displayName) {
      name = data.displayName;
    }
    // Small link back to dashboard, only for admins
    let roleText = getRoleText(data);
    if (isAdminRole(roleText)) {
      if (dashboardLink !== null) {
        dashboardLink.classList.remove('d-none');
      }
    } else {
      // Regular user, dashboard link stays hidden.
    }
  } catch (error) {
    console.log('Cannot read user profile:', error);
  }

  accountName.textContent = name;
  accountName.title = name;
  accountAvatar.textContent = name.charAt(0).toUpperCase();

  try {
    await loadEntries();
  } catch (error) {
    console.log('Cannot load entries:', error);
  }
  renderEntries();
});

// ---------- Entries part ----------
// Every entry is one document inside the "userUsage" collection.
// Document name: userId_entryNumber  (example: abc123_1)
// Fields: header, content, createdAt (timestamp), uid
const entriesList = document.getElementById('entriesList');
const newEntryBtn = document.getElementById('newEntryBtn');
const clearEditorBtn = document.getElementById('clearEditorBtn');
const saveEntryBtn = document.getElementById('saveEntryBtn');
const entryHeader = document.getElementById('entryHeader');
const entryContent = document.getElementById('entryContent');

let myEntries = []; // entries of this user, loaded from Firebase
let selectedId = null; // document name of the entry currently open

// Load this user's entries from the "userUsage" collection
async function loadEntries() {
  const foundQuery = query(collection(db, 'userUsage'), where('uid', '==', currentUserId));
  const entriesSnapshot = await getDocs(foundQuery);

  myEntries = [];
  entriesSnapshot.forEach(function (oneDoc) {
    const data = oneDoc.data();
    myEntries.push({
      id: oneDoc.id, // example: "abc123_1"
      header: data.header,
      content: data.content,
      createdAt: data.createdAt,
    });
  });

  // Show newest first
  myEntries.sort(function (a, b) {
    // Minus returns newest first.
    return entryTime(b) - entryTime(a);
  });
}

// Turn the timestamp field into a JS date in milliseconds
function entryTime(entry) {
  if (entry.createdAt && typeof entry.createdAt.toDate === 'function') {
    return entry.createdAt.toDate().getTime();
  }
  return 0;
}

// Draw the entry list on the left side
function renderEntries() {
  entriesList.innerHTML = '';

  if (myEntries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted small';
    empty.textContent = 'No entries yet. Write your first note!';
    entriesList.appendChild(empty);
    return;
  }

  let drawnCount = 0;

  myEntries.forEach(function (entry) {
    // No header and no content means no data, so skip this card
    if ((entry.header === undefined || entry.header === null || entry.header === '') && (entry.content === undefined || entry.content === null || entry.content === '')) {
      return;
    }
    // One entry card
    const item = document.createElement('div');
    item.className = 'journal-item';
    if (entry.id === selectedId) {
      item.classList.add('active');
    }

    const title = document.createElement('h5');
    title.className = 'journal-item-title';
    // Default title when the header is missing.
    let titleText = 'Untitled';
    if (entry.header !== undefined && entry.header !== null && entry.header !== '') {
      titleText = entry.header;
    }
    title.textContent = titleText;

    const date = document.createElement('span');
    date.className = 'journal-item-date';
    // entryTime already unwraps the Firestore Timestamp.
    let timeNumber = entryTime(entry);
    let dateText = '';
    if (timeNumber !== 0) {
      dateText = new Date(timeNumber).toLocaleString();
    }
    date.textContent = dateText;

    // Small delete button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-entry';
    // Close icon.
    delBtn.textContent = '×';
    delBtn.addEventListener('click', function (event) {
      event.stopPropagation(); // do not open the entry when deleting
      deleteEntry(entry.id);
    });

    item.appendChild(title);
    item.appendChild(date);
    item.appendChild(delBtn);

    // Click on the card to open it in the editor
    item.addEventListener('click', function () {
      openEntry(entry.id);
    });

    entriesList.appendChild(item);
    drawnCount = drawnCount + 1;
  });

  if (drawnCount === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted small';
    empty.textContent = 'No entries yet. Write your first note!';
    entriesList.appendChild(empty);
    return;
  }
}

// Open one entry in the editor
function openEntry(id) {
  selectedId = id;

  for (let i = 0; i < myEntries.length; i++) {
    if (myEntries[i].id === id) {
      entryHeader.value = myEntries[i].header;
      entryContent.value = myEntries[i].content;
    }
  }

  renderEntries();
}

// Delete one entry (removes the document from Firebase)
async function deleteEntry(id) {
  const confirmed = confirm('Delete this entry?');
  if (confirmed === false) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'userUsage', id));

    if (selectedId === id) {
      clearEditor();
    } else {
      await loadEntries();
      renderEntries();
    }
  } catch (error) {
    console.log(error);
    alert('Could not delete the entry.');
  }
}

// Empty the editor and forget the selected entry
function clearEditor() {
  selectedId = null;
  entryHeader.value = '';
  entryContent.value = '';
  renderEntries();
}

// Check if we already used a document name like "userId_3"
function isIdUsed(id) {
  for (let i = 0; i < myEntries.length; i++) {
    if (myEntries[i].id === id) {
      return true;
    }
  }
  return false;
}

newEntryBtn.addEventListener('click', clearEditor);
clearEditorBtn.addEventListener('click', clearEditor);

saveEntryBtn.addEventListener('click', async function () {
  if (currentUserId === null) {
    alert('Please wait, still loading...');
    return;
  }

  const header = entryHeader.value.trim();
  const content = entryContent.value.trim();

  if (header === '' && content === '') {
    alert('Please write something before saving.');
    return;
  }

  try {
    if (selectedId === null) {
      // Save a brand new entry.
      // Find a free entry number: 1, 2, 3, ...
      let entryNumber = myEntries.length + 1;
      while (isIdUsed(currentUserId + '_' + entryNumber)) {
        entryNumber = entryNumber + 1;
      }

      const docName = currentUserId + '_' + entryNumber;

      await setDoc(doc(db, 'userUsage', docName), {
        uid: currentUserId,
        header: header,
        content: content,
        createdAt: serverTimestamp(),
      });

      selectedId = docName;
    } else {
      // Update the entry that is currently open (createdAt stays the same)
      await updateDoc(doc(db, 'userUsage', selectedId), {
        header: header,
        content: content,
      });
    }

    await loadEntries();
    renderEntries();
  } catch (error) {
    console.log(error.code, error.message);
    alert('Could not save the entry. Check your internet / Firestore rules.');
  }
});
