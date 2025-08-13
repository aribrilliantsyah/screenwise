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
            Selamat Datang di ScreenWise
          </h1>
          <p className="text-lg text-muted-foreground">
            Uji pengetahuan Anda dan lihat seberapa baik Anda melakukannya. Platform cerdas kami tidak hanya menilai kuis Anda tetapi juga memberikan wawasan tentang kinerja Anda.
          </p>
          <Button asChild size="lg">
            <Link href="/quiz">Mulai</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Fitur</CardTitle>
            <CardDescription>Apa yang membuat platform kuis kami unik.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Kuis Interaktif</h3>
                  <p className="text-sm text-muted-foreground">Soal pilihan ganda yang menarik.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Penilaian Instan</h3>
                  <p className="text-sm text-muted-foreground">Dapatkan hasil dan status lulus/gagal Anda secara langsung.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Analisis Berbasis AI</h3>
                  <p className="text-sm text-muted-foreground">Temukan pola kinerja dengan wawasan GenAI.</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Tantangan Berwaktu</h3>
                  <p className="text-sm text-muted-foreground">Uji kecepatan dan akurasi Anda di bawah tekanan.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
