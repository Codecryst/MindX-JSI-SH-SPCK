import {
  auth,
  db,
  doc,
  getDoc,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from './firebase-config.js';
import { startInactivityTimer } from './inactivity.js';

// Get the elements from the page
const form = document.getElementById('loginForm');
const messageBox = document.getElementById('messageBox');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeBox = document.getElementById('rememberMe');

// Small helper to show a message (uses .show .error .success classes)
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message-box show ' + type;
}

// 15 minute inactivity timeout: clear password and warn the user
startInactivityTimer(function () {
  passwordInput.value = '';
  showMessage('Timed out after 15 minutes of inactivity. Please try again.', 'error');
});

// When the login page opens: if we remembered the account before,
// put it back into the form so the user does not have to type again.
const savedAccount = localStorage.getItem('mindlog_account');
if (savedAccount !== null) {
  const account = JSON.parse(savedAccount);
  emailInput.value = account.email;
  passwordInput.value = account.password;
  rememberMeBox.checked = true;
}

form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the page from reloading

  // 1. Read what the user typed
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeBox.checked;

  try {
    // 2. Choose how long Firebase keeps this login
    if (rememberMe === true) {
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
    if (rememberMe === true) {
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
      if (profile.exists()) {
        const data = profile.data();
        let raw = data.roleId;
        if (raw === undefined || raw === null || raw === '') {
          raw = data.role;
        }
        if (typeof raw === 'string' && (raw.trim().toLowerCase() === 'admin' || raw.trim().toLowerCase() === 'administrator')) {
          nextPage = 'admin.html';
        }
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
