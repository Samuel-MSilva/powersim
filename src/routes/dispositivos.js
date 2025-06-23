const express = require('express');
const router = express.Router();
const knex = require('../database/db');

// Página inicial: lista todos os dispositivos com cálculo de consumo e custo
router.get('/', async (req, res) => {
  try {
    const dispositivos = await knex('dispositivos').select('*');
    const config = await knex('configuracoes').first();
    const tarifa = config?.tarifa || 0;

    const dispositivosComConsumo = dispositivos.map(d => {
      const consumoDiaKWh = (d.potencia * d.horas_por_dia) / 1000;
      const consumoMesKWh = consumoDiaKWh * 30;
      const custoDia = consumoDiaKWh * tarifa;
      const custoMes = consumoMesKWh * tarifa;

      return {
        ...d,
        consumoDiaKWh: consumoDiaKWh.toFixed(2),
        consumoMesKWh: consumoMesKWh.toFixed(2),
        custoDia: custoDia.toFixed(2),
        custoMes: custoMes.toFixed(2)
      };
    });

    res.render('listagem', {
      dispositivos: dispositivosComConsumo,
      tarifa: tarifa.toFixed(2)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao listar dispositivos');
  }
});

// Página de formulário para novo dispositivo
router.get('/novo', (req, res) => {
  res.render('novo_dispositivo', { dispositivo: null });
});

// Cadastro de novo dispositivo
router.post('/novo', async (req, res) => {
  const { nome, potencia, horas_por_dia } = req.body;
  await knex('dispositivos').insert({
    nome,
    potencia: parseFloat(potencia),
    horas_por_dia: parseFloat(horas_por_dia)
  });
  res.redirect('/dispositivos');
});

// Página de edição de um dispositivo
router.get('/:id/editar', async (req, res) => {
  const { id } = req.params;
  const dispositivo = await knex('dispositivos').where({ id }).first();

  if (!dispositivo) {
    return res.status(404).send('Dispositivo não encontrado');
  }

  res.render('novo_dispositivo', { dispositivo });
});

// Atualização de um dispositivo
router.post('/:id/editar', async (req, res) => {
  const { id } = req.params;
  const { nome, potencia, horas_por_dia } = req.body;

  await knex('dispositivos')
    .where({ id })
    .update({
      nome,
      potencia: parseFloat(potencia),
      horas_por_dia: parseFloat(horas_por_dia)
    });

  res.redirect('/dispositivos');
});

// Página para editar tarifa
router.get('/config', async (req, res) => {
  const config = await knex('configuracoes').first();
  res.render('configuracao', { tarifa: config.tarifa });
});

// Atualização da tarifa
router.post('/config', async (req, res) => {
  const { tarifa } = req.body;
  await knex('configuracoes').update({ tarifa: parseFloat(tarifa) }).where({ id: 1 });
  res.redirect('/dispositivos/config');
});

// Exclusão de dispositivo
router.post('/:id/delete', async (req, res) => {
  const { id } = req.params;
  await knex('dispositivos').where({ id }).del();
  res.redirect('/dispositivos');
});

const { Parser } = require('json2csv');

// Exportar dispositivos como CSV
router.get('/exportar', async (req, res) => {
  try {
    const dispositivos = await knex('dispositivos').select('*');
    const config = await knex('configuracoes').first();
    const tarifa = config?.tarifa || 0;

    const dados = dispositivos.map(d => {
      const consumoDiaKWh = (d.potencia * d.horas_por_dia) / 1000;
      const consumoMesKWh = consumoDiaKWh * 30;
      const custoDia = consumoDiaKWh * tarifa;
      const custoMes = consumoMesKWh * tarifa;

      return {
        Nome: d.nome,
        Potencia_W: d.potencia,
        Horas_por_Dia: d.horas_por_dia,
        Consumo_Dia_kWh: consumoDiaKWh.toFixed(2),
        Consumo_Mes_kWh: consumoMesKWh.toFixed(2),
        Custo_Dia_R$: custoDia.toFixed(2),
        Custo_Mes_R$: custoMes.toFixed(2)
      };
    });

    const parser = new Parser();
    const csv = parser.parse(dados);

    res.header('Content-Type', 'text/csv');
    res.attachment('dispositivos.csv');
    return res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao exportar dados');
  }
});

// Página de resumo de consumo
router.get('/resumo', async (req, res) => {
  try {
    const dispositivos = await knex('dispositivos').select('*');
    const config = await knex('configuracoes').first();
    const tarifa = config?.tarifa || 0;

    const dados = dispositivos.map(d => {
      const consumoMesKWh = ((d.potencia * d.horas_por_dia) / 1000) * 30;
      const custoMes = consumoMesKWh * tarifa;

      return {
        nome: d.nome,
        custoMes: parseFloat(custoMes.toFixed(2))
      };
    });

    const custoTotal = dados.reduce((acc, d) => acc + d.custoMes, 0);
    const media = (dados.length > 0) ? (custoTotal / dados.length).toFixed(2) : 0;

    res.render('resumo', {
      dispositivos: dados,
      total: custoTotal.toFixed(2),
      media
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao gerar resumo');
  }
});

module.exports = router;
