
'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminEmail = 'admin@screenwise.com';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('rahasia', salt);

    // Delete existing admin user to ensure a clean slate on every seed.
    // This prevents issues with old, incorrect password hashes.
    await queryInterface.bulkDelete('Users', { email: adminEmail }, {});

    // Insert the admin user with the correct password hash.
    await queryInterface.bulkInsert('Users', [{
      email: adminEmail,
      passwordHash: passwordHash,
      name: 'Admin',
      isAdmin: true,
      address: 'Kantor Pusat',
      gender: 'Laki-laki',
      whatsapp: '081234567890',
      phone: '081234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    // This will remove the admin user created by the seeder.
    await queryInterface.bulkDelete('Users', { email: 'admin@screenwise.com' }, {});
  }
};
