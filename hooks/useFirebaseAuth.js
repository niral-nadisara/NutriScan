// hooks/useFirebaseAuth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../firebase/config';

//console.log('🔥 Firebase Auth:', auth);

export const logIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const googleLoginWithIdToken = async (id_token) => {
  try {
    const credential = GoogleAuthProvider.credential(id_token);
    const result = await signInWithCredential(auth, credential);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};