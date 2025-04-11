import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from './config';
import { db } from './config'; // Ensure db = getFirestore(app) is exported from config.js

export const saveUserData = async (data) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

export const getUserData = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};