import {
  auth,
  db,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  doc,
  setDoc,
  serverTimestamp,
} from './firebase-config.js';
import { startInactivityTimer } from './inactivity.js';

// Get the elements from the page
const form = document.getElementById('registerForm');
const messageBox = document.getElementById('messageBox');

// Small helper to show a message (uses .show .error .success classes)
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message-box show ' + type;
}

// 15 minute inactivity timeout: clear password and warn the user
startInactivityTimer(function () {
  const passwordInput = document.getElementById('password');
  if (passwordInput !== null) {
    passwordInput.value = '';
  }
  showMessage('Timed out after 15 minutes of inactivity. Please try again.', 'error');
});

form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the page from reloading

  // 1. Read what the user typed
  const displayName = document.getElementById('displayName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // 2. Simple checks
  if (displayName === '' || email === '' || password === '') {
    showMessage('Please fill in all fields.', 'error');
    return;
  }
  if (displayName.length > 20) {
    showMessage('Display name must be 20 characters or less.', 'error');
    return;
  }
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters.', 'error');
    return;
  }

  try {
    // 3. Choose how long Firebase keeps this login
    const rememberMe = document.getElementById('rememberMe').checked;
    if (rememberMe === true) {
      // Remembered: stays logged in even after closing the browser
      await setPersistence(auth, browserLocalPersistence);
    } else {
      // Session only: logged out when the browser is closed
      await setPersistence(auth, browserSessionPersistence);
    }

    // 4. Create the account in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 5. Save the user info into the "users" collection in Firestore
    //    (this is why you see the new user in the Firebase console)
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      displayName: displayName,
      roleId: 'customer',
      createdAt: serverTimestamp(),
    });

    // 6. Save or remove the saved account depending on the checkbox
    const account = { email: email, password: password };
    if (rememberMe === true) {
      localStorage.setItem('mindlog_account', JSON.stringify(account));
      sessionStorage.removeItem('mindlog_account');
    } else {
      sessionStorage.setItem('mindlog_account', JSON.stringify(account));
      localStorage.removeItem('mindlog_account');
    }

    // 7. Tell the user and go to user.html
    showMessage('Account created! Redirecting...', 'success');
    setTimeout(function () {
      window.location.href = 'user.html';
    }, 800);
  } catch (error) {
    console.log(error.code, error.message);

    if (error.code === 'auth/email-already-in-use') {
      showMessage('This email already has an account.', 'error');
    } else if (error.code === 'auth/invalid-email') {
      showMessage('Please enter a valid email.', 'error');
    } else if (error.code === 'auth/weak-password') {
      showMessage('Password must be at least 6 characters.', 'error');
    } else {
      showMessage('Register failed: ' + error.message, 'error');
    }
  }
});
