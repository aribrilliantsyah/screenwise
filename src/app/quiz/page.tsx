"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";

export default function QuizPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'attempted' | 'ready'>('loading');

  useEffect(() => {
    // A generic user id for non-authenticated users
    const userId = "guest_user";
    const attempt = localStorage.getItem(`quiz_attempt_${userId}`);
    if (attempt) {
      setStatus('attempted');
      router.push("/quiz/results");
    } else {
      setStatus('ready');
    }
  }, [router]);
  
  if (status === 'loading' || status === 'attempted') {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <QuizClient />;
}
