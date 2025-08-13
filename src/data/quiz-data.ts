export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const quizQuestions: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris",
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswer: "Mars",
  },
  {
    id: 3,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: "Pacific Ocean",
  },
  {
    id: 4,
    question: "Who wrote 'To Kill a Mockingbird'?",
    options: ["Harper Lee", "J.K. Rowling", "Ernest Hemingway", "Mark Twain"],
    correctAnswer: "Harper Lee",
  },
  {
    id: 5,
    question: "What is the chemical symbol for water?",
    options: ["O2", "H2O", "CO2", "NaCl"],
    correctAnswer: "H2O",
  },
];

export const MOCK_SUBMISSIONS = [
    {
      userId: 'user1',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Pacific Ocean', '4': 'Harper Lee', '5': 'H2O' },
      score: 100
    },
    {
      userId: 'user2',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Pacific Ocean', '4': 'J.K. Rowling', '5': 'H2O' },
      score: 80
    },
    {
      userId: 'user3',
      answers: { '1': 'Paris', '2': 'Earth', '3': 'Atlantic Ocean', '4': 'Harper Lee', '5': 'CO2' },
      score: 40
    },
     {
      userId: 'user4',
      answers: { '1': 'Paris', '2': 'Mars', '3': 'Pacific Ocean', '4': 'Harper Lee', '5': 'NaCl' },
      score: 80
    }
];

export const PASSING_SCORE_PERCENTAGE = 60;
export const QUIZ_TIME_SECONDS = 300; // 5 minutes
