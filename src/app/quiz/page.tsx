"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function QuizPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Cek apakah pengguna saat ini sudah pernah mencoba kuis
  const attempt = localStorage.getItem(`quiz_attempt_${user.email}`);
  if (attempt) {
    router.push("/quiz/results");
    return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <QuizClient />;
}
