import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from './firebase-config.js';

const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const entryList = document.getElementById('entryList');
const entryForm = document.getElementById('entryForm');
const entryHeaderInput = document.getElementById('entryHeader');
const entryContentInput = document.getElementById('entryContent');
const journalMessage = document.getElementById('journalMessage');
const newEntryBtn = document.getElementById('newEntryBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;
let selectedEntryId = null;

function showMessage(message, type = 'error') {
  journalMessage.textContent = message;
  journalMessage.className = `message-box ${type}`;
}

function formatDisplayName(name) {
  if (!name) return 'User';
  return name.trim() || 'User';
}

function updateAvatar(name) {
  const firstLetter = formatDisplayName(name).charAt(0).toUpperCase();
  userAvatar.textContent = firstLetter;
}

async function getNextEntryNumber(uid) {
  const snapshot = await getDocs(collection(db, "user's usage"));
  let highest = 0;

  snapshot.forEach((docSnap) => {
    if (docSnap.id.startsWith(`${uid}_`)) {
      const numberPart = Number(docSnap.id.split('_').pop());
      if (!Number.isNaN(numberPart) && numberPart > highest) {
        highest = numberPart;
      }
    }
  });

  return highest + 1;
}

async function loadUserProfile(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  const profile = userDoc.exists() ? userDoc.data() : {};
  const displayName = formatDisplayName(profile.displayName || currentUser.displayName || 'User');

  userName.textContent = displayName;
  updateAvatar(displayName);
}

async function loadEntries() {
  entryList.innerHTML = '';

  const snapshot = await getDocs(collection(db, "user's usage"));
  const entries = [];

  snapshot.forEach((docSnap) => {
    if (docSnap.id.startsWith(`${currentUser.uid}_`)) {
      const data = docSnap.data();
      entries.push({
        id: docSnap.id,
        header: data.header || 'Untitled entry',
        content: data.content || '',
        createdAt: data.createdAt || null,
      });
    }
  });

  entries.sort((a, b) => {
    const aTime = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const bTime = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return aTime - bTime;
  });

  if (!entries.length) {
    entryList.innerHTML = '<div class="text-muted">No journal entries yet.</div>';
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'entry-item';
    if (selectedEntryId === entry.id) {
      item.classList.add('active');
    }

    const labelWrap = document.createElement('div');
    labelWrap.style.flex = '1';
    labelWrap.style.minWidth = '0';

    const title = document.createElement('div');
    title.textContent = entry.header;
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';

    const meta = document.createElement('small');
    meta.className = 'text-muted d-block';
    meta.textContent = entry.createdAt && entry.createdAt.seconds
      ? new Date(entry.createdAt.seconds * 1000).toLocaleString()
      : 'Recently created';

    labelWrap.appendChild(title);
    labelWrap.appendChild(meta);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-entry';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      await deleteDoc(doc(db, "user's usage", entry.id));
      if (selectedEntryId === entry.id) {
        clearForm();
      }
      await loadEntries();
    });

    item.appendChild(labelWrap);
    item.appendChild(deleteBtn);

    item.addEventListener('click', () => {
      selectedEntryId = entry.id;
      entryHeaderInput.value = entry.header;
      entryContentInput.value = entry.content;
      showMessage('Entry loaded.', 'success');
      loadEntries();
    });

    entryList.appendChild(item);
  });
}

function clearForm() {
  selectedEntryId = null;
  entryForm.reset();
  showMessage('', 'success');
}

newEntryBtn.addEventListener('click', () => {
  clearForm();
  entryHeaderInput.focus();
});

clearFormBtn.addEventListener('click', () => {
  clearForm();
});

logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
  window.location.href = 'login.html';
});

entryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const header = entryHeaderInput.value.trim();
  const content = entryContentInput.value.trim();

  if (!header) {
    showMessage('Please enter a header for the entry.', 'error');
    return;
  }

  if (!content) {
    showMessage('Please write some content before saving.', 'error');
    return;
  }

  try {
    if (selectedEntryId) {
      await updateDoc(doc(db, "user's usage", selectedEntryId), {
        header,
        content,
        updatedAt: serverTimestamp(),
      });
      showMessage('Entry updated successfully.', 'success');
    } else {
      const nextNumber = await getNextEntryNumber(currentUser.uid);
      const docId = `${currentUser.uid}_${nextNumber}`;

      await setDoc(doc(db, "user's usage", docId), {
        header,
        content,
        createdAt: serverTimestamp(),
      });

      selectedEntryId = docId;
      showMessage('New entry saved successfully.', 'success');
    }

    await loadEntries();
  } catch (error) {
    console.error(error);
    showMessage('Something went wrong while saving the entry.', 'error');
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = user;
  await loadUserProfile(user.uid);
  await loadEntries();
});
