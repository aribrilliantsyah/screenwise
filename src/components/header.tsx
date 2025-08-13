"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl font-bold text-foreground tracking-tight">
          ScreenWise
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/quiz">Ikuti Kuis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
