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

onAuthStateChanged(auth, async function (user) {
  if (user === null) {
    authButtons.classList.remove('d-none');
    navAccount.classList.add('d-none');
    navAccount.classList.remove('d-flex');
    if (navLogoutBtn !== null) {
      navLogoutBtn.classList.add('d-none');
    }
    // Logged out: show Create account / Sign in, hide Go to journal
    if (heroAuthButtons !== null) {
      heroAuthButtons.classList.remove('d-none');
      heroAuthButtons.classList.add('d-flex');
    }
    if (heroJournalBox !== null) {
      heroJournalBox.classList.add('d-none');
      heroJournalBox.classList.remove('d-flex');
    }
    return;
  }

  // Logged in: hide Login/Register, show account instead
  let name = user.email;
  let page = 'user.html';
  try {
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.displayName) {
        name = data.displayName;
      }
      let raw = data.roleId;
      if (raw === undefined || raw === null || raw === '') {
        raw = data.role;
      }
      if (typeof raw === 'string' && (raw.trim().toLowerCase() === 'admin' || raw.trim().toLowerCase() === 'administrator')) {
        page = 'admin.html';
      }
    }
  } catch (error) {
    console.log('Cannot read profile:', error);
  }

  navAvatar.textContent = name.charAt(0).toUpperCase();
  navName.textContent = name;
  navName.title = name;
  navAccount.href = page;

  authButtons.classList.add('d-none');
  navAccount.classList.remove('d-none');
  navAccount.classList.add('d-flex');
  if (navLogoutBtn !== null) {
    navLogoutBtn.classList.remove('d-none');
  }

  // Logged in: hide Create account / Sign in, show Go to journal
  if (heroAuthButtons !== null) {
    heroAuthButtons.classList.add('d-none');
    heroAuthButtons.classList.remove('d-flex');
  }
  if (heroJournalBox !== null && heroJournalBtn !== null) {
    heroJournalBtn.href = page;
    heroJournalBox.classList.remove('d-none');
    heroJournalBox.classList.add('d-flex');
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
