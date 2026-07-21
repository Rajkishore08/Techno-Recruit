import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentIdToken, setCurrentIdToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const token = await user.getIdToken();
          setCurrentIdToken(token);
        } catch (e) {
          console.error("Failed to fetch ID token:", e);
        }
      } else {
        // Fallback for local development
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          setCurrentUser({
            uid: "local_dev_admin",
            displayName: "Local Developer Admin",
            email: "dev@techno-recruit.local",
            photoURL: "https://lh3.googleusercontent.com/a/default-user"
          });
          setCurrentIdToken("local_dev_token");
        } else {
          setCurrentUser(null);
          setCurrentIdToken(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setCurrentUser(result.user);
      setCurrentIdToken(token);
      return result.user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentIdToken(null);
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, currentIdToken, signInWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
