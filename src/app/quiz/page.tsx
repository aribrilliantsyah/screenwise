"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function QuizPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'attempted' | 'ready'>('loading');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const attempt = localStorage.getItem(`quiz_attempt_${user.uid}`);
    if (attempt) {
      setStatus('attempted');
      router.push("/quiz/results");
    } else {
      setStatus('ready');
    }
  }, [router, user, loading]);
  
  if (status === 'loading' || status === 'attempted' || loading || !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <QuizClient />;
}
