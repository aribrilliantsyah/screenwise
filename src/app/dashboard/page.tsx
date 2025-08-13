
"use client";

import { useAuth } from "@/contexts/auth-context";
import { quizGroups } from "@/data/quiz-data";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, PlayCircle, CheckCircle, XCircle, ChevronRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AttemptStatus {
  [quizId: string]: {
    passed: boolean;
    score: number;
  } | null;
}

export default function DashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>({});

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (isAdmin) {
        router.push("/admin");
      }
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (user) {
      const status: AttemptStatus = {};
      quizGroups.forEach(quiz => {
        const attemptRaw = localStorage.getItem(`quiz_attempt_${user.email}_${quiz.id}`);
        if (attemptRaw) {
          const attempt = JSON.parse(attemptRaw);
          status[quiz.id] = { passed: attempt.passed, score: attempt.score };
        } else {
          status[quiz.id] = null;
        }
      });
      setAttemptStatus(status);
    }
  }, [user]);

  if (loading || !user || isAdmin) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Dasbor Peserta</h1>
        <p className="text-lg text-muted-foreground">Selamat datang, {user.email}! Pilih kuis untuk memulai.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizGroups.map(quiz => {
          const status = attemptStatus[quiz.id];
          const hasAttempted = status !== null;

          return (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><BookOpen className="text-primary"/>{quiz.title}</CardTitle>
                        <CardDescription className="mt-2">{quiz.description}</CardDescription>
                    </div>
                    {hasAttempted && status && (
                        <Badge variant={status.passed ? "default" : "destructive"} className={status.passed ? 'bg-green-500' : ''}>
                          {status.passed ? 'Lulus' : 'Gagal'}
                        </Badge>
                    )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="text-sm text-muted-foreground">
                    <p>Jumlah Soal: {quiz.questions.length}</p>
                    <p>Waktu: {quiz.timeLimitSeconds / 60} menit</p>
                    <p>Skor Kelulusan: {quiz.passingScore}%</p>
                 </div>
              </CardContent>
              <CardFooter>
                {hasAttempted ? (
                  <Button asChild className="w-full">
                    <Link href={`/quiz/results?quizId=${quiz.id}`}>
                      <CheckCircle /> Lihat Hasil
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={`/quiz/${quiz.id}`}>
                      <PlayCircle /> Mulai Kuis
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
