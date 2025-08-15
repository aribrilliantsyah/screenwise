
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Although the redirect logic is now handled client-side in the form,
// we keep this server-side check as a fallback for users who are already logged in
// and try to access the login page directly.
export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.user.isAdmin ? "/admin" : "/dashboard");
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
