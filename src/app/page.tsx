import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-20">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
            Welcome to ScreenWise
          </h1>
          <p className="text-lg text-muted-foreground">
            Test your knowledge and see how you stack up. Our intelligent platform not only scores your quiz but also provides insights into your performance.
          </p>
          <Button asChild size="lg">
            <Link href="/quiz">Get Started</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What makes our quiz platform unique.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Interactive Quizzes</h3>
                  <p className="text-sm text-muted-foreground">Engaging multiple-choice questions.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Instant Scoring</h3>
                  <p className="text-sm text-muted-foreground">Get your results and pass/fail status immediately.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">AI-Powered Analysis</h3>
                  <p className="text-sm text-muted-foreground">Discover performance patterns with GenAI insights.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Timed Challenges</h3>
                  <p className="text-sm text-muted-foreground">Test your speed and accuracy under pressure.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
