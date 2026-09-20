// Main index page script
// Handles the landing page UI: shows Login/Register when logged out,
// shows account avatar and Go to Journal when logged in

// Import Firebase services and functions from our config file
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
} from './firebase-config.js';

// Main logic: if logged in, replace
// Login/Register buttons with avatar + name.

// Get all the HTML elements we need to show/hide
const authButtons = document.getElementById('authButtons');          // Login/Register buttons
const navAccount = document.getElementById('navAccount');            // Account dropdown container
const navAvatar = document.getElementById('navAvatar');              // Avatar circle with initial
const navName = document.getElementById('navName');                  // Display name in navbar
const navLogoutBtn = document.getElementById('navLogoutBtn');        // Logout button in navbar
const heroAuthButtons = document.getElementById('heroAuthButtons');  // Hero section Login/Register
const heroJournalBox = document.getElementById('heroJournalBox');    // Hero section Go to Journal box
const heroJournalBtn = document.getElementById('heroJournalBtn');    // Hero section Go to Journal button

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

function showBox(element) {
  if (element === null || element === undefined) {
    return;
  }
  element.classList.remove('d-none');
  element.classList.add('d-flex');
}

function hideBox(element) {
  if (element === null || element === undefined) {
    return;
  }
  element.classList.add('d-none');
  element.classList.remove('d-flex');
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

// Listen for authentication state changes (login, logout, page load)
onAuthStateChanged(auth, async function (user) {
  if (user === null) {
    // No user logged in -> show logged out UI
    showLoggedOut();
    return;
  }

  // Logged in: hide Login/Register, show account instead
  let name = user.email;
  let page = 'user.html'; // The page that user and admin will go to when they use the app
  try {
    // Read the user profile from Firestore
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

  // Update the navbar with user info
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