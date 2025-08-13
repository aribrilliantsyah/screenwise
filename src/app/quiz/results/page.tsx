"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { analyzeQuizPerformance, type AnalyzeQuizPerformanceOutput } from "@/ai/flows/analyze-quiz-performance";
import { MOCK_SUBMISSIONS, PASSING_SCORE_PERCENTAGE, quizQuestions } from "@/data/quiz-data";
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
}

export default function ResultsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeQuizPerformanceOutput | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const storedAttempt = localStorage.getItem(`quiz_attempt_${user.uid}`);
    if (storedAttempt) {
      const parsedAttempt = JSON.parse(storedAttempt);
      setAttempt(parsedAttempt);
      fetchAnalysis(parsedAttempt, user.uid);
    } else {
      router.push("/quiz");
    }
  }, [router, user, authLoading]);

  const fetchAnalysis = async (userAttempt: Attempt, currentUserId: string) => {
    setLoadingAnalysis(true);
    try {
        const currentUserSubmission = {
            userId: currentUserId,
            answers: userAttempt.answers,
            score: userAttempt.score,
        };
        const allSubmissions = [...MOCK_SUBMISSIONS, currentUserSubmission];

      const result = await analyzeQuizPerformance({
        quizName: "Kuis Pengetahuan",
        submissions: allSubmissions,
        highPerformanceThreshold: PASSING_SCORE_PERCENTAGE,
      });
      setAnalysis(result);
    } catch (error) {
      console.error("Gagal mendapatkan analisis AI:", error);
      setAnalysis({ keyInsights: "Tidak dapat mengambil analisis.", suggestedImprovements: "Silakan coba lagi nanti." });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleRetake = () => {
    if (user) {
      localStorage.removeItem(`quiz_attempt_${user.uid}`);
      router.push("/quiz");
    }
  };

  const memoizedQuizQuestions = useMemo(() => quizQuestions, []);

  if (authLoading || !attempt) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
      <Card className="w-full">
        <CardHeader className="text-center items-center">
          {attempt.passed ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
          <CardTitle className="text-3xl font-bold font-headline mt-4">
            Hasil Kuis
          </CardTitle>
          <CardDescription className="text-xl">
            Anda mendapat skor {attempt.score.toFixed(0)}% dan Anda <span className={attempt.passed ? "font-bold text-green-600" : "font-bold text-destructive"}>{attempt.passed ? "Lulus" : "Gagal"}</span>.
          </CardDescription>
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
                 {memoizedQuizQuestions.map((q) => {
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
                <Button onClick={handleRetake} size="lg">Ulangi Kuis</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
