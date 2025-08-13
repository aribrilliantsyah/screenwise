
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analyzeQuizPerformance, type AnalyzeQuizPerformanceOutput } from "@/ai/flows/analyze-quiz-performance";
import { MOCK_SUBMISSIONS, quizGroups } from "@/data/quiz-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit, Lightbulb, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

interface Attempt {
  answers: Record<string, string>;
  score: number;
  passed: boolean;
  timestamp: string;
  quizId: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeQuizPerformanceOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quizId = searchParams.get('quizId');
  const quiz = useMemo(() => quizGroups.find(q => q.id === quizId), [quizId]);

  useEffect(() => {
    if (authLoading) return; 

    if (!user) {
        router.push('/login');
        return;
    }
    if (!quizId) {
        router.push('/dashboard');
        return;
    }

    const storedAttempt = localStorage.getItem(`quiz_attempt_${user.email}_${quizId}`);
    if (storedAttempt && quiz) {
      const parsedAttempt = JSON.parse(storedAttempt);
      setAttempt(parsedAttempt);
      fetchAnalysis(parsedAttempt, user.email, quiz);
      setLoading(false);
    } else {
      // Jika tidak ada percobaan, mungkin pengguna mencoba mengakses langsung.
      // Arahkan ke dasbor agar mereka bisa memilih kuis.
      router.push(`/dashboard`);
    }
  }, [router, user, authLoading, quizId, quiz]);

  const fetchAnalysis = async (userAttempt: Attempt, currentUserId: string, currentQuiz: any) => {
    setLoadingAnalysis(true);
    try {
        const currentUserSubmission = {
            userId: currentUserId,
            answers: userAttempt.answers,
            score: userAttempt.score,
        };
        const allSubmissions = [...MOCK_SUBMISSIONS.filter(s => s.quizId === quizId), currentUserSubmission];

      const result = await analyzeQuizPerformance({
        quizName: currentQuiz.title,
        submissions: allSubmissions,
        highPerformanceThreshold: currentQuiz.passingScore,
      });
      setAnalysis(result);
    } catch (error) {
      console.error("Gagal mendapatkan analisis AI:", error);
      // Memberikan pesan error yang lebih deskriptif kepada pengguna
      setAnalysis({ keyInsights: "Analisis AI tidak tersedia saat ini.", suggestedImprovements: "Pastikan kunci API GenAI telah dikonfigurasi dengan benar di variabel lingkungan." });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleBackToDashboard = () => {
    setIsSubmitting(true);
    router.push("/dashboard");
  };

  if (loading || authLoading || !attempt || !quiz) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const { passed, score } = attempt;
  const isInterviewQualified = passed;

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
      <Card className="w-full">
        <CardHeader className="text-center items-center">
          {passed ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
          <CardTitle className="text-3xl font-bold font-headline mt-4">
            Hasil {quiz.title}
          </CardTitle>
          <CardDescription className="text-xl">
            Anda mendapat skor {score.toFixed(0)}% dan Anda <span className={passed ? "font-bold text-green-600" : "font-bold text-destructive"}>{passed ? "Lulus" : "Gagal"}</span>.
          </CardDescription>
          {isInterviewQualified && (
            <Alert variant="default" className="mt-4 max-w-md bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Selamat!</AlertTitle>
                <AlertDescription className="text-green-700">
                    Anda lolos untuk melanjutkan ke tahap interview. Tim kami akan segera menghubungi Anda.
                </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-6 w-6 text-primary"/> Wawasan Utama</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingAnalysis ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : (
                            <p className="text-muted-foreground">{analysis?.keyInsights}</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-accent"/> Saran Perbaikan</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {loadingAnalysis ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                         ) : (
                            <p className="text-muted-foreground">{analysis?.suggestedImprovements}</p>
                         )}
                    </CardContent>
                </Card>
            </div>
            <div>
                 <h3 className="text-xl font-semibold mb-4 text-center">Jawaban Anda</h3>
                 <div className="space-y-4">
                 {quiz.questions.map((q) => {
                     const userAnswer = attempt.answers[q.id] || "Tidak dijawab";
                     const isCorrect = userAnswer === q.correctAnswer;
                     return (
                         <Alert key={q.id} variant={isCorrect ? "default" : "destructive"} className="bg-background/70">
                             {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                             <AlertTitle>{q.question}</AlertTitle>
                             <AlertDescription>
                                 Jawaban Anda: <span className="font-semibold">{userAnswer}</span>
                                 {!isCorrect && <span className="ml-2">| Jawaban benar: <span className="font-semibold">{q.correctAnswer}</span></span>}
                             </AlertDescription>
                         </Alert>
                     )
                 })}
                 </div>
            </div>

            <div className="text-center">
                <Button onClick={handleBackToDashboard} size="lg" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Kembali ke Dasbor
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

