
"use client"

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";
import { getQuizBySlug, type QuizWithQuestions } from "@/actions/quiz";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/session-context";
import type { SafeUser } from "@/actions/user";

export default function DynamicQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { session, loading: authLoading } = useSession();
  
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const quizSlug = useMemo(() => Array.isArray(params.id) ? params.id[0] : params.id, [params.id]);
  
  useEffect(() => {
    if (authLoading) return;
    
    const user = session?.user;
    if (!user) {
        router.push('/login');
        return;
    }

    async function loadInitialData() {
        setLoading(true);
        const quizData = await getQuizBySlug(quizSlug);
        
        if (!quizData) {
          setError("Kuis yang Anda cari tidak ada atau telah dihapus.");
          setLoading(false);
          return;
        }
        
        setQuiz(quizData);

        // Check for previous attempt *after* getting quiz data
        const attemptKey = `quiz_attempt_${user.email}_${quizData.id}`;
        const attempt = localStorage.getItem(attemptKey);
        
        if (attempt) {
          router.push('/dashboard');
          // No need to set loading to false, as we are navigating away
          return;
        }

        setLoading(false);
    }

    loadInitialData();
  }, [authLoading, session, router, quizSlug]);
  
  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Kuis tidak ditemukan</h1>
            <p>{error}</p>
            <Button onClick={() => router.push('/dashboard')}>Kembali ke Dasbor</Button>
        </div>
    );
  }

  if (!quiz || !session?.user) {
    // This state should ideally not be reached due to the checks above,
    // but it's a good safeguard.
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p>Sesi tidak valid atau kuis tidak ditemukan. Mengarahkan...</p>
        <Loader2 className="h-16 w-16 animate-spin text-primary ml-4" />
      </div>
    );
  }

  return <QuizClient quiz={quiz} user={session.user} />;
}
