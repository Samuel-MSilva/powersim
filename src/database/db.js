const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './src/database/simulacoes.db'
  },
  useNullAsDefault: true,
});

module.exports = knex;
