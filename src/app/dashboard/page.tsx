
"use client";

import { getQuizzes, type QuizWithQuestions } from "@/actions/quiz";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, PlayCircle, BarChart2, HelpCircle, Clock, Award, LucideRedo, CheckCheck, ClipboardList, List } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/contexts/session-context";

interface AttemptStatus {
  [quizId: number]: {
    passed: boolean;
    score: number;
  } | null;
}

interface ActiveQuizSession {
    quizId: number;
    timeLeft: number;
    answers: Record<string, string>;
    startTime: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useSession();
  const user = session?.user;

  const [allQuizzes, setAllQuizzes] = useState<QuizWithQuestions[]>([]);
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>({});
  const [activeSession, setActiveSession] = useState<ActiveQuizSession | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  useEffect(() => {
    // Jika sesi masih loading, jangan lakukan apa-apa
    if (authLoading) return;

    // Jika sudah tidak loading dan tidak ada user, arahkan ke login
    if (!user) {
        router.push("/login");
        return;
    }

    // Jika user adalah admin, arahkan ke dasbor admin
    if (user.isAdmin) {
        router.push("/admin");
        return;
    }
    
    // Jika ada user, ambil data
    const fetchData = async () => {
        setIsLoadingData(true);
        const quizzes = await getQuizzes();
        setAllQuizzes(quizzes);

        const status: AttemptStatus = {};
        quizzes.forEach(quiz => {
            const attemptRaw = localStorage.getItem(`quiz_attempt_${user.email}_${quiz.id}`);
            if (attemptRaw) {
                const attempt = JSON.parse(attemptRaw);
                status[quiz.id] = { passed: attempt.passed, score: attempt.score };
            } else {
                status[quiz.id] = null;
            }
        });
        setAttemptStatus(status);

        const activeSessionRaw = localStorage.getItem(`active_quiz_session_${user.email}`);
        if (activeSessionRaw) {
            setActiveSession(JSON.parse(activeSessionRaw));
        }
        setIsLoadingData(false);
    };
    
    fetchData();
  }, [user, authLoading, router]);


  const handleNavigation = (quizId: number, path: string) => {
    setLoadingQuiz(quizId);
    router.push(path);
  };

  if (authLoading || isLoadingData) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // Ini seharusnya tidak akan terjadi jika authLoading sudah false,
    // tetapi sebagai pengaman tambahan.
    return null;
  }

  const isQuizActive = !!activeSession;
  const attemptedQuizzes = allQuizzes.filter(quiz => !!attemptStatus[quiz.id]);
  const availableQuizzes = allQuizzes.filter(quiz => !attemptStatus[quiz.id]);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Dasbor Peserta</h1>
        <p className="text-lg text-muted-foreground">Selamat datang, {user.name}! Pilih kuis untuk memulai.</p>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><List /> Kuis Tersedia</h2>
          {availableQuizzes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableQuizzes.map((quiz, index) => {
                  const isActiveQuiz = isQuizActive && activeSession.quizId === quiz.id;
                  const canStartQuiz = !isQuizActive || isActiveQuiz;

                  return (
                    <Card key={`${quiz.id}-${index}`} className={`flex flex-col transition-shadow duration-300 ${!canStartQuiz ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}>
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
                          onClick={() => handleNavigation(quiz.id, `/quiz/${quiz.slug}`)} 
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
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                <CheckCheck className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold">Semua Kuis Selesai!</h3>
                <p className="text-muted-foreground">Anda telah menyelesaikan semua kuis yang tersedia. Hebat!</p>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><ClipboardList /> Riwayat Kuis</h2>
          {attemptedQuizzes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {attemptedQuizzes.map((quiz, index) => {
              const status = attemptStatus[quiz.id];
              return (
                <Card key={`${quiz.id}-${index}`} className="flex flex-col transition-shadow duration-300 hover:shadow-lg">
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
                            {status.passed ? 'Lulus' : 'Gagal'} (Skor: {status.score.toFixed(0)}%)
                        </div>
                    )}
                    <Button onClick={() => handleNavigation(quiz.id, `/quiz/results?quizId=${quiz.id}`)} className="w-full" variant="outline" disabled={loadingQuiz === quiz.id}>
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
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Belum Ada Riwayat</h3>
                <p className="text-muted-foreground">Anda belum menyelesaikan kuis apa pun. Mulai kerjakan kuis dari daftar di atas!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
