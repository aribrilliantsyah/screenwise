export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizGroup {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  timeLimitSeconds: number;
}


export const quizGroups: QuizGroup[] = [
  {
    id: "pengetahuan-umum",
    title: "Kuis Pengetahuan Umum",
    description: "Uji wawasan umum Anda tentang dunia di sekitar kita.",
    passingScore: 60,
    timeLimitSeconds: 300, // 5 menit
    questions: [
      {
        id: 1,
        question: "Apa ibu kota Perancis?",
        options: ["Berlin", "Madrid", "Paris", "Roma"],
        correctAnswer: "Paris",
      },
      {
        id: 2,
        question: "Planet mana yang dikenal sebagai Planet Merah?",
        options: ["Bumi", "Mars", "Jupiter", "Venus"],
        correctAnswer: "Mars",
      },
      {
        id: 3,
        question: "Apa samudra terbesar di Bumi?",
        options: ["Samudra Atlantik", "Samudra Hindia", "Samudra Arktik", "Samudra Pasifik"],
        correctAnswer: "Samudra Pasifik",
      },
      {
        id: 4,
        question: "Siapa yang menulis 'To Kill a Mockingbird'?",
        options: ["Harper Lee", "J.K. Rowling", "Ernest Hemingway", "Mark Twain"],
        correctAnswer: "Harper Lee",
      },
      {
        id: 5,
        question: "Apa simbol kimia untuk air?",
        options: ["O2", "H2O", "CO2", "NaCl"],
        correctAnswer: "H2O",
      },
    ]
  },
  {
    id: "logika-dasar",
    title: "Kuis Logika Dasar",
    description: "Asah kemampuan berpikir logis dan pemecahan masalah Anda.",
    passingScore: 80,
    timeLimitSeconds: 600, // 10 menit
    questions: [
      {
        id: 1,
        question: "Jika semua mawar berwarna merah, dan Anda memiliki mawar, apa warnanya?",
        options: ["Biru", "Kuning", "Merah", "Tidak bisa ditentukan"],
        correctAnswer: "Merah",
      },
      {
        id: 2,
        question: "Angka berikutnya dalam deret 2, 4, 8, 16, ... adalah?",
        options: ["20", "24", "32", "64"],
        correctAnswer: "32",
      },
      {
        id: 3,
        question: "Seorang petani memiliki 17 domba. Semua kecuali 9 mati. Berapa banyak domba yang tersisa?",
        options: ["8", "9", "17", "0"],
        correctAnswer: "9",
      }
    ]
  }
];


export const MOCK_SUBMISSIONS = [
    {
      userId: 'pengguna1@contoh.com',
      quizId: 'pengetahuan-umum',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Samudra Pasifik', '4': 'Harper Lee', '5': 'H2O' },
      score: 100
    },
    {
      userId: 'pengguna2@contoh.com',
      quizId: 'pengetahuan-umum',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Samudra Pasifik', '4': 'J.K. Rowling', '5': 'H2O' },
      score: 80
    },
    {
      userId: 'pengguna3@contoh.com',
      quizId: 'pengetahuan-umum',
      answers: { '1': 'Paris', '2': 'Bumi', '3': 'Samudra Atlantik', '4': 'Harper Lee', '5': 'CO2' },
      score: 40
    },
     {
      userId: 'pengguna1@contoh.com',
      quizId: 'logika-dasar',
      answers: { '1': 'Merah', '2': '32', '3': '9' },
      score: 100
    }
];

// Deprecated, use passingScore in QuizGroup instead
export const PASSING_SCORE_PERCENTAGE = 60;
// Deprecated, use timeLimitSeconds in QuizGroup instead
export const QUIZ_TIME_SECONDS = 300; 

// Deprecated, use quizGroups instead
export const quizQuestions = quizGroups[0].questions;

