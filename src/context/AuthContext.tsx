"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";

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

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<PasswordResetResult>;
  verifyResetCode: (code: string) => Promise<{ success: boolean; email?: string; error?: string }>;
  confirmReset: (code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => ({ success: false, error: "Not initialized" }),
  signIn: async () => ({ success: false, error: "Not initialized" }),
  signInWithGoogle: async () => ({ success: false, error: "Not initialized" }),
  signOut: async () => {},
  sendPasswordReset: async () => ({ success: false, error: "Not initialized" }),
  verifyResetCode: async () => ({ success: false, error: "Not initialized" }),
  confirmReset: async () => ({ success: false, error: "Not initialized" }),
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
      case "auth/missing-email":
        return "Please enter your email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/expired-action-code":
        return "This password reset link has expired. Please request a new one.";
      case "auth/invalid-action-code":
        return "This password reset link is invalid or has already been used. Please request a new one.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please verify your credentials and try again.";
      case "auth/too-many-requests":
        return "Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.";
      case "auth/operation-not-allowed":
        return "This sign-in provider is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.";
      case "auth/network-request-failed":
        return "Network request failed. Please check your internet connection.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/cancelled-popup-request":
        return "Sign-in request was cancelled.";
      case "auth/popup-blocked":
        return "Google sign-in popup was blocked by your browser. Please allow popups for this site.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for Google Sign-In in Firebase Console. Please add it under Authentication > Settings > Authorized domains.";
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
        // Enforce email verification requirement for password users:
        // Google accounts are verified by Google automatically.
        if (!firebaseUser.emailVerified && firebaseUser.providerData.some(p => p.providerId === "password")) {
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

        if (db && firebaseUser.uid) {
          setDoc(
            doc(db, "users", firebaseUser.uid),
            {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Learner",
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              role: firebaseUser.email === "testorbit@ellipse.com" ? "admin" : "learner",
            },
            { merge: true }
          ).catch(() => {});
        }
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

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured) {
      const demoUser: UserProfile = {
        id: "google_usr_" + Math.random().toString(36).substring(2, 9),
        email: "student.google@testorbit.in",
        name: "Google Student",
        createdAt: new Date().toISOString(),
      };
      setUser(demoUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
      } catch {}
      return { success: true };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userObj: UserProfile = {
        id: googleUser.uid,
        email: googleUser.email || "",
        name: googleUser.displayName || googleUser.email?.split("@")[0] || "Student",
        createdAt: googleUser.metadata.creationTime || new Date().toISOString(),
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

  const sendPasswordReset = async (
    email: string
  ): Promise<PasswordResetResult> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return {
        success: false,
        error: "Please enter a valid email address.",
      };
    }

    if (!isFirebaseConfigured || !auth) {
      // Mock fallback mode when Firebase client is not configured
      return { success: true };
    }

    try {
      const continueUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "https://testorbit.vercel.app/login";

      try {
        await sendPasswordResetEmail(auth, trimmedEmail, {
          url: continueUrl,
          handleCodeInApp: false,
        });
      } catch (acsErr: unknown) {
        const acsCode = (acsErr as { code?: string })?.code;
        if (
          acsCode === "auth/unauthorized-continue-uri" ||
          acsCode === "auth/invalid-continue-uri"
        ) {
          // If domain isn't authorized for continue URL yet, fallback cleanly
          await sendPasswordResetEmail(auth, trimmedEmail);
        } else {
          throw acsErr;
        }
      }
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      // Prevent account enumeration: treat user-not-found as generic success
      if (code === "auth/user-not-found") {
        return { success: true };
      }
      return {
        success: false,
        error: formatAuthError(err),
      };
    }
  };

  const verifyResetCode = async (
    code: string
  ): Promise<{ success: boolean; email?: string; error?: string }> => {
    const trimmed = code?.trim();
    if (!trimmed) {
      return { success: false, error: "Missing or invalid password reset code." };
    }
    if (!isFirebaseConfigured || !auth) {
      return { success: true, email: "student@example.com" };
    }
    try {
      const email = await verifyPasswordResetCode(auth, trimmed);
      return { success: true, email };
    } catch (err: unknown) {
      return { success: false, error: formatAuthError(err) };
    }
  };

  const confirmReset = async (
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedCode = code?.trim();
    if (!trimmedCode) {
      return { success: false, error: "Missing or invalid password reset code." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }
    if (!isFirebaseConfigured || !auth) {
      return { success: true };
    }
    try {
      await confirmPasswordReset(auth, trimmedCode, newPassword);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: formatAuthError(err) };
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
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        sendPasswordReset,
        verifyResetCode,
        confirmReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
