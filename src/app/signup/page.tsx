
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Although the redirect logic is now handled client-side in the form,
// we keep this server-side check as a fallback for users who are already logged in
// and try to access the signup page directly.
export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect(session.user.isAdmin ? "/admin" : "/dashboard");
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
