import {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  getDoc,
} from './firebase-config.js';

import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const form = document.getElementById('loginForm');
const emailInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginPassword');
const rememberCheck = document.getElementById('rememberMe');
const messageBox = document.getElementById('loginMessage');

function showMessage(message, type = 'error') {
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'user.html';
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !isValidEmail(email)) {
    showMessage('Email format is invalid.', 'error');
    return;
  }

  if (!password || password.length < 8) {
    showMessage('Password must be at least 8 characters long.', 'error');
    return;
  }

  try {
    await setPersistence(auth, rememberCheck.checked ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (userDoc.exists()) {
      showMessage('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'user.html';
      }, 500);
      return;
    }

    showMessage('This account is missing a profile. Please contact support.', 'error');
    await auth.signOut();
  } catch (error) {
    const code = error.code || '';

    if (code === 'auth/user-not-found') {
      showMessage('Account not found. Please register first.', 'error');
    } else if (code === 'auth/wrong-password') {
      showMessage('Wrong password. Please try again.', 'error');
    } else if (code === 'auth/invalid-email') {
      showMessage('Email format is invalid.', 'error');
    } else if (code === 'auth/invalid-credential') {
      showMessage('Email or password is incorrect.', 'error');
    } else {
      showMessage('Login failed. Please try again.', 'error');
    }
  }
});
