const mysql = require('mysql2/promise');
const config = require('../config');

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.storage.mysql.host,
      port: config.storage.mysql.port,
      user: config.storage.mysql.user,
      password: config.storage.mysql.password,
      database: config.storage.mysql.database,
      connectionLimit: 5,
    });
  }
  return pool;
}

async function insertAttendance({ fecha, estudiante_email, tipo, valor, docente_email }) {
  const p = getPool();
  await p.execute(
    'INSERT INTO registros (fecha, estudiante_email, tipo, valor, docente_email) VALUES (?,?,?,?,?)',
    [fecha, estudiante_email.toLowerCase(), tipo, valor, docente_email]
  );
}

async function getDailyTotal(estudiante_email, fecha) {
  const p = getPool();
  const [rows] = await p.execute(
    'SELECT COALESCE(SUM(valor),0) AS s FROM registros WHERE estudiante_email = ? AND fecha = ?',
    [estudiante_email.toLowerCase(), fecha]
  );
  return Number(rows[0]?.s || 0);
}

async function getTotal(estudiante_email) {
  const p = getPool();
  const [rows] = await p.execute(
    'SELECT COALESCE(SUM(valor),0) AS s FROM registros WHERE estudiante_email = ?',
    [estudiante_email.toLowerCase()]
  );
  return Number(rows[0]?.s || 0);
}

async function getByStudent(estudiante_email) {
  const p = getPool();
  const [rows] = await p.execute(
    'SELECT fecha, tipo, valor FROM registros WHERE estudiante_email = ? ORDER BY fecha ASC',
    [estudiante_email.toLowerCase()]
  );
  return rows.map(r => ({
    fecha: r.fecha.toISOString().slice(0,10),
    tipo: r.tipo,
    valor: Number(r.valor)
  }));
}

module.exports = { insertAttendance, getDailyTotal, getTotal, getByStudent };
