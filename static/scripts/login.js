// Login page script
// Handles user sign in with email/password, remembers account if checkbox checked,
// redirects to admin.html for admins or user.html for regular users

// Import Firebase services and functions from our config file
import {
  auth,
  db,
  doc,
  getDoc,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from './firebase-config.js';

// Get the HTML elements from the page
const form = document.getElementById('loginForm');           // The login form
const messageBox = document.getElementById('messageBox');    // Message display area
const emailInput = document.getElementById('email');         // Email input field
const passwordInput = document.getElementById('password');   // Password input field
const rememberMeBox = document.getElementById('rememberMe'); // Remember me checkbox

// Small helper to show a message (uses .show .error .success classes)
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message-box show ' + type;
}

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

// When the login page opens: if we remembered the account before,
// put it back into the form so the user does not have to type again.
const savedAccount = localStorage.getItem('mindlog_account');
if (savedAccount !== null) {
  const account = JSON.parse(savedAccount);
  emailInput.value = account.email;
  passwordInput.value = account.password;
  rememberMeBox.checked = true;
}

// Handle form submission when user clicks Login button
form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the page from reloading

  // 1. Read what the user typed
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeBox.checked;

  try {
    // 2. Choose how long Firebase keeps this login
    if (rememberMe) {
      // Remembered: stays logged in even after closing the browser
      await setPersistence(auth, browserLocalPersistence);
    } else {
      // Session only: logged out when the browser is closed
      await setPersistence(auth, browserSessionPersistence);
    }

    // 3. Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // 4. Save or remove the saved account depending on the checkbox
    const account = { email: email, password: password };
    if (rememberMe) {
      // localStorage survives closing the website, so the account
      // is loaded again every time the site is visited
      localStorage.setItem('mindlog_account', JSON.stringify(account));
      sessionStorage.removeItem('mindlog_account');
    } else {
      // sessionStorage only lives for this visit (gone when browser closes)
      sessionStorage.setItem('mindlog_account', JSON.stringify(account));
      localStorage.removeItem('mindlog_account');
    }

    // 5. Go to the right page: admins to admin.html, others to user.html
    let nextPage = 'user.html';
    try {
      const profile = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!profile.exists()) {
        // Glitch means Auth exists but no users doc, so stay logged out.
        await signOut(auth);
        showMessage('Account glitch: profile not found. Please register again.', 'error');
        return;
      }
      const data = profile.data();
      let roleText = getRoleText(data);
      if (isAdminRole(roleText)) {
        nextPage = 'admin.html';
      } else {
        nextPage = 'user.html';
      }
    } catch (error) {
      console.log('Cannot read role, going to user page:', error);
    }

    showMessage('Login successful! Redirecting...', 'success');
    setTimeout(function () {
      window.location.href = nextPage;
    }, 800);
  } catch (error) {
    console.log(error.code, error.message);

    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      showMessage('Wrong email or password.', 'error');
    } else {
      showMessage('Login failed: ' + error.message, 'error');
    }
  }
});