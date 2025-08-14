
"use client"

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getQuizGroups, type QuizGroup } from "@/data/quiz-data";
import { Button } from "@/components/ui/button";

export default function DynamicQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const [allQuizzes, setAllQuizzes] = useState<QuizGroup[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  
  const quizId = useMemo(() => Array.isArray(params.id) ? params.id[0] : params.id, [params.id]);
  
  useEffect(() => {
    // Only run on the client
    const quizzes = getQuizGroups();
    setAllQuizzes(quizzes);
    setLoadingQuizzes(false);
  }, []);
  
  const quiz = useMemo(() => {
    // This will only run after allQuizzes has been populated
    return allQuizzes.find(q => q.id === quizId);
  }, [quizId, allQuizzes]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || loadingQuizzes) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // After loading is finished, check for user and quiz
  if (!user) {
    // This case should be covered by the useEffect redirect, but as a safeguard
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
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

  // Cek apakah pengguna saat ini sudah pernah mencoba kuis ini
  const attemptKey = `quiz_attempt_${user.email}_${quiz.id}`;
  const attempt = typeof window !== 'undefined' ? localStorage.getItem(attemptKey) : null;
  
  if (attempt) {
    // Jika sudah pernah mencoba, arahkan kembali ke dasbor.
    // Tombol di dasbor akan mengarah ke hasil.
    router.push('/dashboard');
    return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p>Anda sudah mengerjakan kuis ini. Mengarahkan kembali ke dasbor...</p>
        <Loader2 className="h-16 w-16 animate-spin text-primary ml-4" />
      </div>
    );
  }

  return <QuizClient quiz={quiz} />;
}
