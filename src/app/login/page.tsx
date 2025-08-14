import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
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
