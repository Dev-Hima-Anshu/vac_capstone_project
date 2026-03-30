"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { type Locale, type StringKey, STRINGS } from "@/lib/strings";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: StringKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bharat-locale") as Locale | null;
      if (saved === "en" || saved === "te") setLocaleState(saved);
      const savedTheme = localStorage.getItem("bharat-theme");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("bharat-locale", l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: StringKey) => STRINGS[locale][key] ?? STRINGS.en[key] ?? key,
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  firebaseEnabled: boolean;
  isGuestSession: boolean;
  profileName: string;
  registerWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string, nameHint?: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: (name?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Signs in anonymously when Firebase env is present so Firestore rules can scope data per user.
 */
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [guestName, setGuestName] = useState("Guest Learner");
  const [isGuestSession, setIsGuestSession] = useState(false);
  const firebaseEnabled = isFirebaseConfigured();

  useEffect(() => {
    try {
      const n = localStorage.getItem("bharat-guest-name");
      if (n) setGuestName(n);
      const guest = localStorage.getItem("bharat-guest-session");
      setIsGuestSession(guest === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) {
      setReady(true);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setIsGuestSession(u.isAnonymous);
        try {
          localStorage.setItem("bharat-guest-session", u.isAnonymous ? "1" : "0");
        } catch {
          /* ignore */
        }
        setReady(true);
        return;
      }
      // Do not force anonymous sign-in on load; user can choose Auth/Guest.
      setUser(null);
      setReady(true);
    });
    return () => unsub();
  }, [firebaseEnabled]);

  const registerWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Auth is not configured");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (!cred.user.displayName) {
        await updateProfile(cred.user, {
          displayName: name?.trim() || email.split("@")[0] || "Learner",
        });
      }
      setIsGuestSession(false);
    },
    [],
  );

  const loginWithEmail = useCallback(async (email: string, password: string, nameHint?: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth is not configured");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (nameHint?.trim() && !cred.user.displayName) {
      await updateProfile(cred.user, { displayName: nameHint.trim() });
    }
    setIsGuestSession(false);
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setIsGuestSession(false);
    try {
      localStorage.setItem("bharat-guest-session", "0");
    } catch {
      /* ignore */
    }
  }, []);

  const continueAsGuest = useCallback(async (name?: string) => {
    const nextName = name?.trim() || guestName;
    setGuestName(nextName);
    try {
      localStorage.setItem("bharat-guest-name", nextName);
    } catch {
      /* ignore */
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setIsGuestSession(true);
      return;
    }
    try {
      await signInAnonymously(auth);
      setIsGuestSession(true);
      try {
        localStorage.setItem("bharat-guest-session", "1");
      } catch {
        /* ignore */
      }
    } catch (e) {
      // Common when Anonymous provider is not enabled in Firebase console.
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("auth/configuration-not-found")) {
        setIsGuestSession(true);
        try {
          localStorage.setItem("bharat-guest-session", "1");
        } catch {
          /* ignore */
        }
        return;
      }
      throw e;
    }
  }, [guestName]);

  const profileName =
    user?.displayName ||
    (user?.isAnonymous ? guestName : "") ||
    user?.email?.split("@")[0] ||
    (isGuestSession ? guestName : "");

  const value = useMemo(
    () => ({
      user,
      ready,
      firebaseEnabled,
      isGuestSession,
      profileName,
      registerWithEmail,
      loginWithEmail,
      logout,
      continueAsGuest,
    }),
    [
      user,
      ready,
      firebaseEnabled,
      isGuestSession,
      profileName,
      registerWithEmail,
      loginWithEmail,
      logout,
      continueAsGuest,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
    </LocaleProvider>
  );
}
