import {
  auth,
  db,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  setDoc,
  serverTimestamp,
} from './firebase-config.js';

import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const form = document.getElementById('registerForm');
const displayNameInput = document.getElementById('displayName');
const emailInput = document.getElementById('registerEmail');
const passwordInput = document.getElementById('registerPassword');
const rememberCheck = document.getElementById('rememberMe');
const messageBox = document.getElementById('registerMessage');

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

  const displayName = displayNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!displayName || displayName.length < 2 || displayName !== displayName.replace(/\s+/g, ' ').trim()) {
    showMessage('Display name is required and cannot contain too many spaces.', 'error');
    return;
  }

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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      displayName,
      email: email.toLowerCase(),
      roleId: 'customer',
      createdAt: serverTimestamp(),
    });

    showMessage('Registration successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'user.html';
    }, 700);
  } catch (error) {
    const code = error.code || '';

    if (code === 'auth/email-already-in-use') {
      showMessage('This email is already registered. Please log in instead.', 'error');
    } else if (code === 'auth/weak-password') {
      showMessage('Password is too weak. Use at least 8 characters.', 'error');
    } else if (code === 'auth/invalid-email') {
      showMessage('Email format is invalid.', 'error');
    } else {
      showMessage('Registration failed. Please try again.', 'error');
    }
  }
});
