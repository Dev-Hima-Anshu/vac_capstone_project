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
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
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
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Signs in anonymously when Firebase env is present so Firestore rules can scope data per user.
 */
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const firebaseEnabled = isFirebaseConfigured();

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
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setReady(true);
        return;
      }
      try {
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
      } catch (e) {
        console.error("Anonymous sign-in failed", e);
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, [firebaseEnabled]);

  const value = useMemo(
    () => ({ user, ready, firebaseEnabled }),
    [user, ready, firebaseEnabled],
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
