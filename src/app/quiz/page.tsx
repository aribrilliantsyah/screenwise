"use client"

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";

export default function QuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'attempted' | 'ready'>('loading');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setStatus('unauthenticated');
        router.push("/login?redirect=/quiz");
      } else {
        const attempt = localStorage.getItem(`quiz_attempt_${user.uid}`);
        if (attempt) {
          setStatus('attempted');
          router.push("/quiz/results");
        } else {
          setStatus('ready');
        }
      }
    }
  }, [user, loading, router]);
  
  if (status === 'loading' || status === 'unauthenticated' || status === 'attempted') {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <QuizClient />;
}
