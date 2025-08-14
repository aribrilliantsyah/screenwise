
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { logout } from "@/actions/user";
import { useSession } from "@/contexts/session-context";


export function Header() {
  const router = useRouter();
  const { session } = useSession();
  const user = session?.user;

  const handleLogout = async () => {
    await logout();
    // Instead of pushing, we let the session context and page logic handle the redirect.
    // This prevents race conditions. A page refresh might be needed if session state isn't perfectly synced.
    window.location.href = '/login'; 
  };

  const isAdmin = user?.isAdmin || false;

  const getDashboardLink = () => {
    if (!user) return "/";
    return isAdmin ? "/admin" : "/dashboard";
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "P";
    const names = name.split(' ');
    if (names.length > 1) {
        return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
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
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photo || undefined} alt={user.name ?? ''}/>
                            <AvatarFallback>
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                       <Link href={getDashboardLink()}>
                          <LayoutDashboard className="mr-2 h-4 w-4"/>
                          <span>Dasbor</span>
                       </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                       <Link href="/profile">
                          <UserIcon className="mr-2 h-4 w-4"/>
                          <span>Profil</span>
                       </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                       <LogOut className="mr-2 h-4 w-4"/>
                       <span>Keluar</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
