// Firebase configuration file
// This file sets up the connection to Firebase services (Auth and Firestore)
// Other JavaScript files import from this file to use Firebase

// Import the initializeApp function to start the Firebase app
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

// Import authentication functions from Firebase Auth
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Import Firestore database functions from Firebase Firestore
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Firebase project configuration - these values come from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyAN3aJ15i2xTWCoWeF3TvJXjgFcwrOhsys",
  authDomain: "sh-jsi28-hai-long.firebaseapp.com",
  projectId: "sh-jsi28-hai-long",
  storageBucket: "sh-jsi28-hai-long.firebasestorage.app",
  messagingSenderId: "979200632193",
  appId: "1:979200632193:web:0801688917d9efe5abb480",
  measurementId: "G-1HMW7VPNDM"
};

// Initialize the Firebase app with our project configuration
const app = initializeApp(firebaseConfig);

// Get the authentication service for this app
export const auth = getAuth(app);

// Get the Firestore database service for this app
export const db = getFirestore(app);

// Export all the Firebase functions so other files can use them
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
};