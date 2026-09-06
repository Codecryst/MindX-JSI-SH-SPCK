
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from './firebase-config.js';

// Đăng ký Auth và tạo profile Firestore cho User.
export async function registerUser({ email, password, displayName }) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  try {
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email,
      displayName,
      roleId: 'customer',
      // createdAt: serverTimestamp(),
    });
  } catch (profileError) {
    // Tài khoản Auth đã tạo thành công; profile có thể tạo lại sau.
    console.warn('Không tạo được users profile:', profileError);
  }

  return credential.user;
}