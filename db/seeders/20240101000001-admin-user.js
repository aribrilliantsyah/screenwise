
'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminEmail = 'admin@screenwise.com';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('rahasia', salt);

    const users = await queryInterface.sequelize.query(
      `SELECT * FROM Users WHERE email = :email`,
      {
        replacements: { email: adminEmail },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    if (users.length === 0) {
      await queryInterface.bulkInsert('Users', [{
        email: adminEmail,
        passwordHash: passwordHash, // Corrected typo from paswordHash
        name: 'Admin',
        isAdmin: true,
        address: 'Kantor Pusat',
        gender: 'Laki-laki',
        whatsapp: '081234567890',
        phone: '081234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { email: 'admin@screenwise.com' }, {});
  }
};
