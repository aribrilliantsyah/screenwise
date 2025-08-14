import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const initialQuizGroups = [
  {
    slug: "pengetahuan-umum",
    title: "Kuis Pengetahuan Umum",
    description: "Uji wawasan umum Anda tentang dunia di sekitar kita.",
    passingScore: 60,
    timeLimitSeconds: 300,
    questions: [
      {
        questionText: "Apa ibu kota Perancis?",
        options: ["Berlin", "Madrid", "Paris", "Roma"],
        correctAnswer: "Paris",
      },
      {
        questionText: "Planet mana yang dikenal sebagai Planet Merah?",
        options: ["Bumi", "Mars", "Jupiter", "Venus"],
        correctAnswer: "Mars",
      },
      {
        questionText: "Apa samudra terbesar di Bumi?",
        options: ["Samudra Atlantik", "Samudra Hindia", "Samudra Arktik", "Samudra Pasifik"],
        correctAnswer: "Samudra Pasifik",
      },
    ],
  },
  {
    slug: "logika-dasar",
    title: "Kuis Logika Dasar",
    description: "Asah kemampuan berpikir logis dan pemecahan masalah Anda.",
    passingScore: 80,
    timeLimitSeconds: 600,
    questions: [
      {
        questionText: "Jika semua mawar berwarna merah, dan Anda memiliki mawar, apa warnanya?",
        options: ["Biru", "Kuning", "Merah", "Tidak bisa ditentukan"],
        correctAnswer: "Merah",
      },
      {
        questionText: "Angka berikutnya dalam deret 2, 4, 8, 16, ... adalah?",
        options: ["20", "24", "32", "64"],
        correctAnswer: "32",
      },
      {
        questionText: "Seorang petani memiliki 17 domba. Semua kecuali 9 mati. Berapa banyak domba yang tersisa?",
        options: ["8", "9", "17", "0"],
        correctAnswer: "9",
      },
    ],
  },
];

async function main() {
  console.log('Start seeding...');

  // Seed Admin User
  const adminEmail = 'admin@screenwise.com';
  const adminPassword = 'rahasia';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      name: 'Admin',
      isAdmin: true,
      address: 'Kantor Pusat',
      gender: 'Laki-laki',
      whatsapp: '081234567890',
      phone: '081234567890',
    },
  });
  console.log('Admin user created/updated.');

  // Seed Quizzes
  for (const quizData of initialQuizGroups) {
    const { questions, ...quizInfo } = quizData;
    const quiz = await prisma.quiz.upsert({
      where: { slug: quizInfo.slug },
      update: {},
      create: quizInfo,
    });

    for (const q of questions) {
      // Upsert question based on question text and quizId
      await prisma.question.upsert({
          where: {
              quizId_questionText: {
                  quizId: quiz.id,
                  questionText: q.questionText,
              }
          },
          update: {
              options: q.options,
              correctAnswer: q.correctAnswer,
          },
          create: {
              quizId: quiz.id,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
          }
      });
    }
    console.log(`Seeded quiz: ${quiz.title}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
