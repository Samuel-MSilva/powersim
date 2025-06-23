const knex = require('./db');

async function criarConfiguracao() {
  const existe = await knex.schema.hasTable('configuracoes');
  if (!existe) {
    await knex.schema.createTable('configuracoes', table => {
      table.increments('id').primary();
      table.float('tarifa').notNullable();
    });

    await knex('configuracoes').insert({ tarifa: 0.89 }); // valor inicial
    console.log('Tabela configuracoes criada com tarifa inicial.');
  } else {
    console.log('Tabela configuracoes já existe.');
  }

  process.exit();
}

criarConfiguracao();
