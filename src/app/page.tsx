
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLoginClick = () => {
    setIsLoading(true);
    router.push('/login');
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-20">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
            Selamat Datang di ScreenWise
          </h1>
          <p className="text-lg text-muted-foreground">
            Selamat datang, silakan melengkapi data terlebih dahulu dan mulai kuis.
          </p>
          <Button onClick={handleLoginClick} size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengarahkan...
              </>
            ) : (
              "Masuk untuk Memulai"
            )}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Kuis Mudah & Cepat</CardTitle>
            <CardDescription>Ringkasan singkat tentang platform kami.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Proses Sederhana</h3>
                  <p className="text-sm text-muted-foreground">Cukup daftar, masuk, dan Anda bisa langsung memulai kuis yang tersedia.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Penilaian Langsung</h3>
                  <p className="text-sm text-muted-foreground">Setelah selesai, skor dan status kelulusan Anda akan langsung ditampilkan.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Wawasan Cerdas</h3>
                  <p className="text-sm text-muted-foreground">Dapatkan analisis dari AI untuk melihat bagaimana Anda bisa lebih baik lagi.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
