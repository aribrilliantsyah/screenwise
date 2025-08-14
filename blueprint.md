# ScreenWise - Blueprint

Ini adalah aplikasi Next.js yang dibuat dengan Firebase Studio. Aplikasi ini memungkinkan pengguna untuk mengikuti kuis, mendapatkan skor, dan melihat analisis performa mereka yang didukung oleh AI.

## Arsitektur

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & ShadCN UI
- **Database**: SQLite
- **ORM**: Prisma
- **AI**: Genkit

## Model Data (Prisma)

Skema database didefinisikan di `prisma/schema.prisma`.

- `User`: Menyimpan data pengguna, termasuk kredensial (hash kata sandi) dan informasi profil.
- `Quiz`: Menyimpan informasi tentang setiap kuis, seperti judul, deskripsi, dan skor kelulusan.
- `Question`: Menyimpan pertanyaan, opsi, dan jawaban yang benar untuk setiap kuis.
- `QuizAttempt`: Mencatat setiap percobaan kuis oleh pengguna, termasuk skor dan jawaban mereka.

## Memulai

Untuk menjalankan aplikasi secara lokal:

1.  **Instal Dependensi**:
    ```bash
    npm install
    ```

2.  **Siapkan Database**:
    Jalankan migrasi Prisma untuk membuat file database SQLite dan menerapkan skema.
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **(Opsional) Seed Database**:
    Untuk mengisi database dengan data contoh (kuis awal), jalankan perintah seed.
    ```bash
    npx prisma db seed
    ```

4.  **Jalankan Server Pengembangan**:
    ```bash
    npm run dev
    ```

Aplikasi akan tersedia di `http://localhost:9002`.

Halaman utama terletak di `src/app/page.tsx`.
