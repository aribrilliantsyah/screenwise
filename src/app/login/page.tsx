
"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push(isAdmin ? "/admin" : "/dashboard");
      }
    }
  }, [user, loading, isAdmin, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Masuk</CardTitle>
          <CardDescription>
            Masukkan email Anda di bawah ini untuk masuk ke akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm variant="login" />
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{" "}
            <Link href="/signup" className="underline hover:text-primary">
              Daftar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
