"use client"

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import QuizClient from "@/components/quiz/quiz-client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { quizGroups } from "@/data/quiz-data";

export default function DynamicQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  
  const quizId = Array.isArray(params.id) ? params.id[0] : params.id;
  const quiz = useMemo(() => quizGroups.find(q => q.id === quizId), [quizId]);

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
  const attempt = localStorage.getItem(attemptKey);
  
  if (attempt) {
    router.push(`/quiz/results?quizId=${quiz.id}`);
    return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <QuizClient quiz={quiz} />;
}
