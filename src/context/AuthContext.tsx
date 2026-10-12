"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface SignUpResult {
  success: boolean;
  requiresVerification?: boolean;
  email?: string;
  error?: string;
}

export interface SignInResult {
  success: boolean;
  unverifiedEmail?: string;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => ({ success: false, error: "Not initialized" }),
  signIn: async () => ({ success: false, error: "Not initialized" }),
  signOut: async () => {},
});

const STORAGE_KEY = "testorbit_user";

function formatAuthError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const err = error as { code: string; message: string };
    switch (err.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please verify your credentials and try again.";
      case "auth/too-many-requests":
        return "Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.";
      case "auth/network-request-failed":
        return "Network request failed. Please check your internet connection.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      default:
        return (
          err.message.replace(/^Firebase:\s*(Error\s*)?(\(auth\/[^)]+\)\.?\s*)?/i, "") ||
          "Authentication failed. Please try again."
        );
    }
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      loadFromStorage();
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Enforce email verification requirement:
        // Do NOT treat unverified users as logged in
        if (!firebaseUser.emailVerified) {
          setUser(null);
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          setLoading(false);
          return;
        }

        const userObj: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Student",
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        setUser(userObj);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
        } catch {}
      } else {
        setUser(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {}
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<SignUpResult> => {
    if (!isFirebaseConfigured) {
      return {
        success: true,
        requiresVerification: true,
        email,
      };
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const trimmedName = name?.trim();
      if (trimmedName) {
        try {
          await updateProfile(userCredential.user, {
            displayName: trimmedName,
          });
        } catch (profileErr) {
          console.warn("Failed to update profile display name:", profileErr);
        }
      }

      // 2. Send email verification
      try {
        await sendEmailVerification(userCredential.user);
      } catch (verificationErr) {
        console.warn("Failed to send verification email:", verificationErr);
      }

      // 3. Do NOT sign them in automatically - sign out immediately
      await firebaseSignOut(auth);
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}

      return {
        success: true,
        requiresVerification: true,
        email: userCredential.user.email || email,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatAuthError(err),
      };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<SignInResult> => {
    if (!isFirebaseConfigured) {
      const loggedUser: UserProfile = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split("@")[0],
        createdAt: new Date().toISOString(),
      };
      setUser(loggedUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
      } catch {}
      return { success: true };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 4. If email is not verified, block access and sign out
      if (!userCredential.user.emailVerified) {
        // Resend verification email for convenience
        try {
          await sendEmailVerification(userCredential.user);
        } catch (resendErr) {
          console.warn("Could not resend verification email:", resendErr);
        }

        // Block access
        await firebaseSignOut(auth);
        setUser(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}

        return {
          success: false,
          unverifiedEmail: userCredential.user.email || email,
          error: "Your email is not verified. Please check your inbox and verify it before logging in.",
        };
      }

      // 5. User is verified, grant access
      const userObj: UserProfile = {
        id: userCredential.user.uid,
        email: userCredential.user.email || email,
        name: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || "Student",
        createdAt: userCredential.user.metadata.creationTime || new Date().toISOString(),
      };
      setUser(userObj);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
      } catch {}
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatAuthError(err),
      };
    }
  };

  const signOut = async () => {
    if (isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error("Firebase signOut error:", err);
      }
    }
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
