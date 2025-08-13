export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const quizQuestions: Question[] = [
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
];

export const MOCK_SUBMISSIONS = [
    {
      userId: 'pengguna1',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Samudra Pasifik', '4': 'Harper Lee', '5': 'H2O' },
      score: 100
    },
    {
      userId: 'pengguna2',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Samudra Pasifik', '4': 'J.K. Rowling', '5': 'H2O' },
      score: 80
    },
    {
      userId: 'pengguna3',
      answers: { '1': 'Paris', '2': 'Bumi', '3': 'Samudra Atlantik', '4': 'Harper Lee', '5': 'CO2' },
      score: 40
    },
     {
      userId: 'pengguna4',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Samudra Pasifik', '4': 'Harper Lee', '5': 'NaCl' },
      score: 80
    }
];

export const PASSING_SCORE_PERCENTAGE = 60;
export const QUIZ_TIME_SECONDS = 300; // 5 menit
