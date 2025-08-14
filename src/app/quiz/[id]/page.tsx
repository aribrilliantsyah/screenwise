
"use client"

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";
import { getQuizzes, type QuizWithQuestions } from "@/actions/quiz";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import type { User } from "@prisma/client";

export default function DynamicQuizPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<Omit<User, 'passwordHash'> | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [allQuizzes, setAllQuizzes] = useState<QuizWithQuestions[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  
  const quizSlug = useMemo(() => Array.isArray(params.id) ? params.id[0] : params.id, [params.id]);
  
  useEffect(() => {
    async function loadInitialData() {
        setAuthLoading(true);
        setLoadingQuizzes(true);

        const session = await getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        setUser(session.user);
        setAuthLoading(false);

        const quizzes = await getQuizzes();
        setAllQuizzes(quizzes);
        setLoadingQuizzes(false);
    }
    loadInitialData();
  }, [router]);
  
  const quiz = useMemo(() => {
    if (loadingQuizzes) return null;
    return allQuizzes.find(q => q.slug === quizSlug);
  }, [quizSlug, allQuizzes, loadingQuizzes]);

  if (authLoading || loadingQuizzes) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Kuis tidak ditemukan</h1>
            <p>Kuis yang Anda cari tidak ada atau telah dihapus.</p>
            <Button onClick={() => router.push('/dashboard')}>Kembali ke Dasbor</Button>
        </div>
    );
  }
  
  if (!user) {
    // This should not happen if authLoading is false, but as a safeguard.
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Check if the user has already attempted this quiz
  const attemptKey = `quiz_attempt_${user.email}_${quiz.id}`;
  const attempt = typeof window !== 'undefined' ? localStorage.getItem(attemptKey) : null;
  
  if (attempt) {
    router.push('/dashboard');
    return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p>Anda sudah mengerjakan kuis ini. Mengarahkan kembali ke dasbor...</p>
        <Loader2 className="h-16 w-16 animate-spin text-primary ml-4" />
      </div>
    );
  }

  return <QuizClient quiz={quiz} user={user} />;
}
