"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export function Header() {
  const { user, isAdmin, loading, signOut } = useAuth();

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl font-bold text-foreground tracking-tight">
          ScreenWise
        </Link>
        <div className="flex items-center gap-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : user ? (
            <>
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/quiz">Ikuti Kuis</Link>
              </Button>
              <Button variant="ghost" onClick={signOut}>Keluar</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Daftar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
