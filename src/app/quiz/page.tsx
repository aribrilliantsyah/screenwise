"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getSession } from "@/lib/session";

// Halaman ini sekarang hanya sebagai fallback, pengguna harusnya diarahkan ke /dashboard
export default function QuizRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (!session) {
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);
  
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
