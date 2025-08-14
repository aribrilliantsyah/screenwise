
"use client"

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getQuizzes, type QuizWithQuestions } from "@/actions/quiz";
import { Button } from "@/components/ui/button";

export default function DynamicQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const [allQuizzes, setAllQuizzes] = useState<QuizWithQuestions[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  
  const quizSlug = useMemo(() => Array.isArray(params.id) ? params.id[0] : params.id, [params.id]);
  
  useEffect(() => {
    async function loadData() {
        const quizzes = await getQuizzes();
        setAllQuizzes(quizzes);
        setLoadingQuizzes(false);
    }
    loadData();
  }, []);
  
  const quiz = useMemo(() => {
    if (loadingQuizzes) return null; // Jangan mencari sampai data siap
    return allQuizzes.find(q => q.slug === quizSlug);
  }, [quizSlug, allQuizzes, loadingQuizzes]);

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
  } else {
    // Hanya periksa setelah semua pemuatan selesai
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
      // Safeguard jika redirect belum selesai
      return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }
  
    // Cek apakah pengguna saat ini sudah pernah mencoba kuis ini
    const attemptKey = `quiz_attempt_${user.email}_${quiz.id}`;
    const attempt = typeof window !== 'undefined' ? localStorage.getItem(attemptKey) : null;
    
    if (attempt) {
      // Jika sudah pernah mencoba, arahkan kembali ke dasbor.
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
}
