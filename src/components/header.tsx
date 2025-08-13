"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    return isAdmin ? "/admin" : "/dashboard";
  }

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href={getDashboardLink()} className="text-xl font-bold text-foreground tracking-tight">
          ScreenWise
        </Link>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Daftar</Link>
              </Button>
            </>
          ) : (
            <>
              {isAdmin && (
                 <Button variant="outline" asChild>
                    <Link href="/admin">Dasbor Admin</Link>
                 </Button>
              )}
               {!isAdmin && (
                 <Button variant="outline" asChild>
                    <Link href="/dashboard">Dasbor</Link>
                 </Button>
              )}
              <Button onClick={handleLogout}>Keluar</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
