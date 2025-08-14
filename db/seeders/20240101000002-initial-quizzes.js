
'use strict';

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


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const quizData of initialQuizGroups) {
        const { questions, ...quizInfo } = quizData;
        
        let existingQuiz = await queryInterface.sequelize.query(
            `SELECT id FROM Quizzes WHERE slug = :slug`,
            { replacements: { slug: quizInfo.slug }, type: Sequelize.QueryTypes.SELECT, transaction }
        );

        let quizId;
        if (existingQuiz.length > 0) {
            quizId = existingQuiz[0].id;
            // Also delete existing questions for this quiz to ensure a clean seed
            await queryInterface.bulkDelete('Questions', { quizId: quizId }, { transaction });
        } else {
            const newQuizResult = await queryInterface.bulkInsert('Quizzes', [{
                ...quizInfo,
                createdAt: new Date(),
                updatedAt: new Date(),
            }], { transaction, returning: ['id'] });

            const newQuizRecord = await queryInterface.sequelize.query(
               `SELECT id FROM Quizzes WHERE slug = :slug`,
               { replacements: { slug: quizInfo.slug }, type: Sequelize.QueryTypes.SELECT, transaction }
            );
            quizId = newQuizRecord[0].id;
        }

        const questionInserts = questions.map(q => ({
            quizId: quizId,
            questionText: q.questionText,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        if (questionInserts.length > 0) {
          await queryInterface.bulkInsert('Questions', questionInserts, { transaction });
        }
      }
      await transaction.commit();
    } catch(err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        await queryInterface.bulkDelete('Questions', null, { transaction });
        await queryInterface.bulkDelete('Quizzes', null, { transaction });
        await transaction.commit();
    } catch(err) {
        await transaction.rollback();
        throw err;
    }
  }
};
