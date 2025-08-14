
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type QuizWithQuestions, saveAttempt } from "@/actions/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Timer } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface QuizClientProps {
    quiz: QuizWithQuestions;
}

interface ActiveQuizSession {
    quizId: number;
    timeLeft: number;
    answers: Record<string, string>;
    startTime: number; // Store timestamp of when the quiz was started
}


export default function QuizClient({ quiz }: QuizClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const sessionKey = user ? `active_quiz_session_${user.email}` : '';

  const saveProgress = useCallback(() => {
    if (!user || !sessionKey) return;
    const session: ActiveQuizSession = {
      quizId: quiz.id,
      timeLeft,
      answers,
      startTime: Date.now()
    };
    localStorage.setItem(sessionKey, JSON.stringify(session));
  }, [user, sessionKey, quiz.id, timeLeft, answers]);


  // Initialize state from localStorage or start fresh
  useEffect(() => {
    if (!user || !sessionKey) return;

    const savedSessionRaw = localStorage.getItem(sessionKey);
    if (savedSessionRaw) {
        const savedSession: ActiveQuizSession = JSON.parse(savedSessionRaw);
        // Ensure the saved session is for the current quiz
        if (savedSession.quizId === quiz.id) {
            setAnswers(savedSession.answers || {});
            // Recalculate time left based on when it was last saved
            const elapsed = Math.floor((Date.now() - savedSession.startTime) / 1000);
            const newTimeLeft = savedSession.timeLeft - elapsed;
            setTimeLeft(newTimeLeft > 0 ? newTimeLeft : 0);
        } else {
            // It's a session for a different quiz, so start fresh for this one
            // This case shouldn't happen with the dashboard logic, but as a safeguard:
            localStorage.removeItem(sessionKey); // Clear the old session
            setTimeLeft(quiz.timeLimitSeconds);
            saveProgress(); // Start a new session
        }
    } else {
        // No saved session, start a new one
        setTimeLeft(quiz.timeLimitSeconds);
        const initialSession: ActiveQuizSession = { 
          quizId: quiz.id, 
          timeLeft: quiz.timeLimitSeconds, 
          answers: {}, 
          startTime: Date.now()
        };
        localStorage.setItem(sessionKey, JSON.stringify(initialSession));
    }
    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, quiz.id, sessionKey]);


  // Timer logic
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Save progress periodically
  useEffect(() => {
      if (!isInitialized) return;
      const saveInterval = setInterval(saveProgress, 5000); // Save every 5 seconds
      return () => clearInterval(saveInterval);
  }, [isInitialized, saveProgress]);


  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    // Save progress on every answer change for better resilience
     if (!user || !sessionKey) return;
    const session: ActiveQuizSession = {
      quizId: quiz.id,
      timeLeft,
      answers: newAnswers,
      startTime: Date.now() // Reset startTime to recalculate from this point
    };
    localStorage.setItem(sessionKey, JSON.stringify(session));
  };
  
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!user || !sessionKey) {
      console.error("User not logged in.");
      router.push('/login');
      return;
    }
    
    let score = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    const scorePercentage = (score / quiz.questions.length) * 100;
    const passed = scorePercentage >= quiz.passingScore;

    const localAttemptData = {
      quizId: quiz.id,
      answers,
      score: scorePercentage,
      passed,
      timestamp: new Date().toISOString(),
    };
    
    // Save attempt for this specific quiz to local storage for quick access on dashboard
    localStorage.setItem(`quiz_attempt_${user.email}_${quiz.id}`, JSON.stringify(localAttemptData));
    
    try {
      // Save attempt to database via server action
      const dbAttemptData = {
          userId: user.id,
          quizId: quiz.id,
          score: scorePercentage,
          passed,
          answers,
      };
      await saveAttempt(dbAttemptData);

    } catch (error) {
        console.error("Error saving quiz attempt:", error);
        // Optionally show a toast to the user
    } finally {
        // Clear active session
        localStorage.removeItem(sessionKey);
        router.push(`/quiz/results?quizId=${quiz.id}`);
    }
  }, [isSubmitting, user, sessionKey, router, quiz, answers]);

  if (!isInitialized) {
      return (
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const answeredQuestions = Object.values(answers).filter(Boolean).length;
  const allQuestionsAnswered = answeredQuestions === quiz.questions.length;

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <div>
                <CardTitle className="text-3xl font-bold font-headline">{quiz.title}</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
             </div>
             <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Timer className="h-6 w-6" />
                <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
             </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
           <Progress value={(timeLeft / quiz.timeLimitSeconds) * 100} className="w-full h-2" />
          {quiz.questions.map((q, index) => (
            <div key={q.id}>
              <p className="font-semibold mb-4 text-lg">
                {index + 1}. {q.questionText}
              </p>
              <RadioGroup
                onValueChange={(value) => handleAnswerChange(String(q.id), value)}
                value={answers[q.id]}
                className="space-y-2"
              >
                {q.options.map((option) => (
                  <div key={option} className="flex items-center space-x-3 p-3 rounded-md border border-transparent hover:border-primary transition-colors">
                    <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                    <Label htmlFor={`${q.id}-${option}`} className="flex-1 cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full" size="lg" disabled={!allQuestionsAnswered || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Kuis
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
