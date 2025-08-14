
const path = require('path');

// This configuration is used by the Sequelize CLI.
// It tells the CLI where to find the database file.
module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'db.sqlite'),
    logging: false,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'db.sqlite'),
    logging: false,
  },
};
