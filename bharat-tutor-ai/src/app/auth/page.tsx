"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogIn, UserPlus, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/providers/app-providers";

export default function AuthPage() {
  const {
    user,
    firebaseEnabled,
    registerWithEmail,
    loginWithEmail,
    continueAsGuest,
  } = useFirebaseAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"login" | "register" | "guest" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (
    kind: "login" | "register" | "guest",
    fn: () => Promise<void>,
  ) => {
    setMessage(null);
    setLoading(kind);
    try {
      await fn();
      setMessage("Success! You are signed in.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50/70 via-background to-orange-50/50">
      <SiteHeader />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <UserRound className="size-5" aria-hidden />
              Login / Register
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!firebaseEnabled && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Firebase is not configured. Add keys to `.env.local` and restart dev server.
              </p>
            )}
            {user && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Signed in as {user.isAnonymous ? "Guest user" : user.email ?? user.uid}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username (for rooms/chat)</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Himanshu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="gap-2"
                disabled={loading !== null || !email || !password}
                onClick={() =>
                  run("login", () => loginWithEmail(email.trim(), password, username))
                }
              >
                <LogIn className="size-4" aria-hidden />
                {loading === "login" ? "Logging in..." : "Login"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                disabled={loading !== null || !email || !password}
                onClick={() =>
                  run("register", () => registerWithEmail(email.trim(), password, username))
                }
              >
                <UserPlus className="size-4" aria-hidden />
                {loading === "register" ? "Creating..." : "Register"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={loading !== null}
                onClick={() => run("guest", () => continueAsGuest(username))}
              >
                Continue as Guest
              </Button>
            </div>
            {message && (
              <p className="text-sm text-muted-foreground" role="status">
                {message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              If you see `auth/configuration-not-found`, enable Authentication providers in
              Firebase Console. Guest mode still works locally.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

