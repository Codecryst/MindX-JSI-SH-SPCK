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

// Get the elements from the page
const form = document.getElementById('registerForm');
const messageBox = document.getElementById('messageBox');

// Small helper to show a message (uses .show .error .success classes)
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message-box show ' + type;
}

// Must have: 8 chars, 1 capital, 1 lowercase, 1 number, 1 symbol.
function checkPassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  // Check for a capital letter from A to Z
  if (/[A-Z]/.test(password) === false) {
    return 'Password must have at least 1 capital letter.';
  }
  // Check for a lowercase letter from a to z
  if (/[a-z]/.test(password) === false) {
    return 'Password must have at least 1 lowercase letter.';
  }
  // Check for a digit from 0 to 9
  if (/[0-9]/.test(password) === false) {
    return 'Password must have at least 1 number.';
  }
  // Check for a symbol, which means anything that is not a letter or digit
  if (/[^A-Za-z0-9]/.test(password) === false) {
    return 'Password must have at least 1 symbol (example: ! @ # $).';
  }
  return '';
}

form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the page from reloading

  // 1. Read what the user typed
  const displayName = document.getElementById('displayName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // 2. Simple checks
  if (displayName === '') {
    showMessage('Please enter a display name.', 'error');
    return;
  }
  if (email === '' || password === '') {
    showMessage('Please fill in all fields.', 'error');
    return;
  }
  if (displayName.length > 20) {
    showMessage('Display name must be 20 characters or less.', 'error');
    return;
  }
  const passwordError = checkPassword(password);
  if (passwordError !== '') {
    showMessage(passwordError, 'error');
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
      roleId: 'user',
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
