import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/header';
import { Inter } from 'next/font/google';
import { getSession } from '@/lib/session';
import { SessionProvider } from '@/contexts/session-context';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ScreenWise',
  description: 'Platform kuis cerdas untuk menyaring kandidat dan menganalisis kinerja.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-body antialiased">
        <SessionProvider session={session}>
          <div className="relative flex min-h-screen flex-col">
            <Header user={session?.user ?? null} />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
