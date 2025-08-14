import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
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
