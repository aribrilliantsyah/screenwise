"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizQuestions, QUIZ_TIME_SECONDS, PASSING_SCORE_PERCENTAGE } from "@/data/quiz-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Timer } from "lucide-react";

export default function QuizClient() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_SECONDS);
  const router = useRouter();
  const userId = "guest_user"; // A generic user id for non-authenticated users

  useEffect(() => {
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
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };
  
  const handleSubmit = () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    const scorePercentage = (score / quizQuestions.length) * 100;
    const passed = scorePercentage >= PASSING_SCORE_PERCENTAGE;

    const attemptData = {
      answers,
      score: scorePercentage,
      passed,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(`quiz_attempt_${userId}`, JSON.stringify(attemptData));
    router.push("/quiz/results");
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const allQuestionsAnswered = Object.keys(answers).length === quizQuestions.length;

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <div>
                <CardTitle className="text-3xl font-bold font-headline">Knowledge Quiz</CardTitle>
                <CardDescription>Answer all questions before the time runs out.</CardDescription>
             </div>
             <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Timer className="h-6 w-6" />
                <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
             </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
           <Progress value={(timeLeft / QUIZ_TIME_SECONDS) * 100} className="w-full h-2" />
          {quizQuestions.map((q, index) => (
            <div key={q.id}>
              <p className="font-semibold mb-4 text-lg">
                {index + 1}. {q.question}
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
          <Button onClick={handleSubmit} className="w-full" size="lg" disabled={!allQuestionsAnswered}>
            Submit Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
