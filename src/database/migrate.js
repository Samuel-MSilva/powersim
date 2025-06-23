const knex = require('./db');

async function criarTabela() {
  const existe = await knex.schema.hasTable('dispositivos');

  if (!existe) {
    await knex.schema.createTable('dispositivos', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.integer('potencia').notNullable(); // em Watts
      table.float('horas_por_dia').notNullable();
      table.timestamps(true, true);
    });
    console.log('Tabela dispositivos criada com sucesso!');
  } else {
    console.log('Tabela dispositivos já existe.');
  }

  await knex.destroy();
}

criarTabela();
