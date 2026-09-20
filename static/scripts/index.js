import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
} from './firebase-config.js';

// Simple student-level logic: if logged in, replace
// Login/Register buttons with avatar + name.
const authButtons = document.getElementById('authButtons');
const navAccount = document.getElementById('navAccount');
const navAvatar = document.getElementById('navAvatar');
const navName = document.getElementById('navName');
const navLogoutBtn = document.getElementById('navLogoutBtn');
const heroAuthButtons = document.getElementById('heroAuthButtons');
const heroJournalBox = document.getElementById('heroJournalBox');
const heroJournalBtn = document.getElementById('heroJournalBtn');

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

// d-none means hidden and d-flex means shown as a flex row.
function showBox(el) {
  if (el === null || el === undefined) {
    return;
  }
  el.classList.remove('d-none');
  el.classList.add('d-flex');
}

// d-none means hidden and d-flex means shown as a flex row.
function hideBox(el) {
  if (el === null || el === undefined) {
    return;
  }
  el.classList.add('d-none');
  el.classList.remove('d-flex');
}

function isAdminRole(roleText) {
  return roleText === 'admin' || roleText === 'administrator';
}

// Logged-out UI: show Login/Register, hide account and journal.
function showLoggedOut() {
  showBox(authButtons);
  hideBox(navAccount);
  hideBox(navLogoutBtn);
  showBox(heroAuthButtons);
  hideBox(heroJournalBox);
}

onAuthStateChanged(auth, async function (user) {
  if (user === null) {
    showLoggedOut();
    return;
  }

  // Logged in: hide Login/Register, show account instead
  let name = user.email;
  let page = 'user.html'; //The page that user and admin will go to when they use the app
  try {
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.displayName) {
        name = data.displayName;
      }
      let roleText = getRoleText(data);
      if (isAdminRole(roleText)) {
        page = 'admin.html';
      } else {
        page = 'user.html';
      }
    } else {
      // Glitch means Auth exists but no users doc, so treat as logged out.
      try {
        await signOut(auth);
      } catch (error) {
        console.log('Cannot sign out:', error);
      }
      showLoggedOut();
      return;
    }
  } catch (error) {
    console.log('Cannot read profile:', error);
  }

  navAvatar.textContent = name.charAt(0).toUpperCase();
  navName.textContent = name;
  navName.title = name;
  navAccount.href = page;

  hideBox(authButtons);
  showBox(navAccount);
  showBox(navLogoutBtn);

  // Logged in: hide Create account / Sign in, show Go to journal
  hideBox(heroAuthButtons);
  if (heroJournalBox !== null && heroJournalBtn !== null) {
    heroJournalBtn.href = page;
    showBox(heroJournalBox);
  }
});

// Logout button next to the account -> end session and stay on index
if (navLogoutBtn !== null) {
  navLogoutBtn.addEventListener('click', async function () {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
    window.location.href = 'index.html';
  });
}
