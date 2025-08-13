"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";

export default function QuizPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'attempted' | 'ready'>('loading');

  useEffect(() => {
    // Unique user ID for anonymous users, can be a simple timestamp or random string
    const anonUserId = localStorage.getItem('anon_user_id') || `anon_${Date.now()}`;
    if (!localStorage.getItem('anon_user_id')) {
      localStorage.setItem('anon_user_id', anonUserId);
    }
    
    const attempt = localStorage.getItem(`quiz_attempt_${anonUserId}`);
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
