import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// User's exact Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzFAa-AqAWYD8hagmZKSJSSyipslt9zVM",
  authDomain: "scmain-ai.firebaseapp.com",
  projectId: "scmain-ai",
  storageBucket: "scmain-ai.firebasestorage.app",
  messagingSenderId: "718248148625",
  appId: "1:718248148625:web:e4ae1689a5e342b84ec930",
  measurementId: "G-1CJ1E8Q9V7",
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out error:', error);
    throw error;
  }
}
