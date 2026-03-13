"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { club } from "@/config/club";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "magic-link" | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error("שגיאה", { description: decodeURIComponent(error) });
    }
  }, [error]);

  function getCallbackUrl() {
    const base = `${window.location.origin}/auth/callback`;
    return next ? `${base}?next=${encodeURIComponent(next)}` : base;
  }

  async function handleGoogleLogin() {
    setLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getCallbackUrl(),
      },
    });
    if (error) {
      toast.error("שגיאה בהתחברות", { description: error.message });
      setLoading(null);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading("magic-link");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getCallbackUrl(),
      },
    });

    if (error) {
      toast.error("שגיאה בשליחת קישור", { description: error.message });
    } else {
      setMagicLinkSent(true);
      toast.success("הקישור נשלח!", {
        description: "בדקו את תיבת המייל שלכם",
      });
    }
    setLoading(null);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center gradient-mesh p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src={club.heroLogo}
            alt={club.name}
            width={80}
            height={80}
            className="rounded-2xl"
            priority
          />
          <h1 className="font-display text-2xl font-bold">{club.name}</h1>
          <p className="text-muted-foreground text-sm">{club.tagline}</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">התחברות</CardTitle>
            <CardDescription>היכנסו לחשבון שלכם</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={handleGoogleLogin}
              disabled={loading !== null}
            >
              {loading === "google" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GoogleIcon className="size-4" />
              )}
              התחברות עם Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">או</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {magicLinkSent ? (
              <div className="space-y-3 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
                  <Mail className="size-5 text-success" />
                </div>
                <p className="text-sm font-medium">שלחנו קישור התחברות</p>
                <p className="text-xs text-muted-foreground">
                  בדקו את תיבת המייל ב-
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMagicLinkSent(false)}
                >
                  שלח שוב
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    autoComplete="email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading !== null}
                >
                  {loading === "magic-link" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  שלח קישור התחברות
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-dvh items-center justify-center gradient-mesh p-4">
      <div className="w-full max-w-sm animate-pulse space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="size-20 rounded-2xl bg-muted" />
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
