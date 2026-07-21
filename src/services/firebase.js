import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const defaultFirebaseConfig = {
  apiKey: "AIzaSyBJa0JPhdfdGI8qsVsLyvB87VvqvFb4LR8",
  authDomain: "techno-recruit.firebaseapp.com",
  projectId: "techno-recruit",
  storageBucket: "techno-recruit.firebasestorage.app",
  messagingSenderId: "235364274013",
  appId: "1:235364274013:web:9db2497f8946987989e2b4",
  measurementId: "G-LKVL7NWK5L"
};

const app = initializeApp(defaultFirebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
