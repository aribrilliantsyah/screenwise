
"use client";

import { useAuth } from "@/contexts/auth-context";
import { quizGroups } from "@/data/quiz-data";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, PlayCircle, BarChart2, HelpCircle, Clock, Award, LucideRedo } from "lucide-react";
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

interface ActiveQuizSession {
    quizId: string;
    timeLeft: number;
    answers: Record<string, string>;
    startTime: number;
}


export default function DashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>({});
  const [activeSession, setActiveSession] = useState<ActiveQuizSession | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState<string | null>(null);

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
      // Load attempt history
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

      // Load active session
      const activeSessionRaw = localStorage.getItem(`active_quiz_session_${user.email}`);
      if (activeSessionRaw) {
          setActiveSession(JSON.parse(activeSessionRaw));
      }
    }
  }, [user]);

  const handleNavigation = (quizId: string, path: string) => {
    setLoadingQuiz(quizId);
    router.push(path);
  };

  if (loading || !user || isAdmin) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const isQuizActive = !!activeSession;
  const attemptedQuizzes = quizGroups.filter(quiz => !!attemptStatus[quiz.id]);
  const availableQuizzes = quizGroups.filter(quiz => !attemptStatus[quiz.id]);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Dasbor Peserta</h1>
        <p className="text-lg text-muted-foreground">Selamat datang, {user.name}! Pilih kuis untuk memulai.</p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Kuis Tersedia</h2>
        {availableQuizzes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableQuizzes.map(quiz => {
                const isActiveQuiz = isQuizActive && activeSession.quizId === quiz.id;
                const canStartQuiz = !isQuizActive || isActiveQuiz;

                return (
                  <Card key={quiz.id} className={`flex flex-col transition-shadow duration-300 ${!canStartQuiz ? 'opacity-50' : 'hover:shadow-lg'}`}>
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">{quiz.title}</CardTitle>
                      <CardDescription className="mt-1">{quiz.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                       <div className="flex items-center text-sm text-muted-foreground gap-2">
                          <HelpCircle className="h-4 w-4 text-primary" /> 
                          <span>{quiz.questions.length} soal</span>
                       </div>
                       <div className="flex items-center text-sm text-muted-foreground gap-2">
                          <Clock className="h-4 w-4 text-primary" /> 
                          <span>{quiz.timeLimitSeconds / 60} menit</span>
                       </div>
                       <div className="flex items-center text-sm text-muted-foreground gap-2">
                          <Award className="h-4 w-4 text-primary" /> 
                          <span>Skor kelulusan: {quiz.passingScore}%</span>
                       </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-4">
                      <Button 
                        onClick={() => handleNavigation(quiz.id, `/quiz/${quiz.id}`)} 
                        className="w-full" 
                        disabled={loadingQuiz === quiz.id || !canStartQuiz}
                      >
                        {loadingQuiz === quiz.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                           isActiveQuiz ? <LucideRedo /> : <PlayCircle />
                        )}
                         {isActiveQuiz ? 'Lanjutkan Kuis' : 'Mulai Kuis'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">Anda telah menyelesaikan semua kuis yang tersedia.</p>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Riwayat Kuis</h2>
        {attemptedQuizzes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {attemptedQuizzes.map(quiz => {
            const status = attemptStatus[quiz.id];
            return (
              <Card key={quiz.id} className="flex flex-col transition-shadow duration-300 hover:shadow-lg opacity-80">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">{quiz.title}</CardTitle>
                    <CardDescription className="mt-1">{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                   <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" /> 
                      <span>{quiz.questions.length} soal</span>
                   </div>
                   <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Clock className="h-4 w-4 text-primary" /> 
                      <span>{quiz.timeLimitSeconds / 60} menit</span>
                   </div>
                   <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Award className="h-4 w-4 text-primary" /> 
                      <span>Skor kelulusan: {quiz.passingScore}%</span>
                   </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 flex flex-col items-stretch gap-4">
                  {status && (
                      <div className={`text-center p-2 rounded-md font-semibold text-sm ${status.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {status.passed ? 'Lulus' : 'Gagal'}
                      </div>
                  )}
                  <Button onClick={() => handleNavigation(quiz.id, `/quiz/results?quizId=${quiz.id}`)} className="w-full" variant="secondary" disabled={loadingQuiz === quiz.id}>
                     {loadingQuiz === quiz.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <BarChart2 />
                      )}
                      Lihat Hasil
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        ) : (
          <p className="text-muted-foreground">Anda belum menyelesaikan kuis apa pun.</p>
        )}
      </div>
    </div>
  );
}
