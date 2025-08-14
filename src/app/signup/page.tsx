
"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
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
          <CardTitle className="text-2xl font-bold font-headline">Daftar</CardTitle>
          <CardDescription>
            Buat akun untuk memulai kuis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm variant="signup" />
           <div className="mt-4 text-center text-sm">
            Sudah punya akun?{" "}
            <Link href="/login" className="underline hover:text-primary">
              Masuk
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
