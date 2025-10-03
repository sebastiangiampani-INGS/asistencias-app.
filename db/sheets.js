const { google } = require('googleapis');
const { readFileSync } = require('fs');
const config = require('../config');

let sheets;

function getSheets() {
  if (sheets) return sheets;
  const cred = JSON.parse(readFileSync(config.storage.sheets.serviceAccountJson, 'utf-8'));
  const auth = new google.auth.JWT(
    cred.client_email,
    null,
    cred.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

const RANGE = 'asistencias!A:F';

async function insertAttendance({ fecha, estudiante_email, tipo, valor, docente_email }) {
  const s = getSheets();
  const row = [new Date().toISOString(), fecha, estudiante_email, tipo, valor, docente_email];
  await s.spreadsheets.values.append({
    spreadsheetId: config.storage.sheets.sheetId,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] }
  });
}

async function getAll() {
  const s = getSheets();
  const res = await s.spreadsheets.values.get({
    spreadsheetId: config.storage.sheets.sheetId,
    range: RANGE,
  });
  const rows = res.data.values || [];
  const start = rows[0] && String(rows[0][0]).toLowerCase().includes('timestamp') ? 1 : 0;
  return rows.slice(start).map(cols => ({
    timestamp: cols[0],
    fecha: cols[1],
    estudiante_email: (cols[2] || '').toLowerCase(),
    tipo: cols[3],
    valor: parseFloat(cols[4] || '0'),
    docente_email: cols[5]
  }));
}

async function getDailyTotal(estudiante_email, fecha) {
  const rows = await getAll();
  return rows
    .filter(r => r.estudiante_email === estudiante_email.toLowerCase() && r.fecha === fecha)
    .reduce((s, r) => s + (Number(r.valor) || 0), 0);
}

async function getTotal(estudiante_email) {
  const rows = await getAll();
  return rows
    .filter(r => r.estudiante_email === estudiante_email.toLowerCase())
    .reduce((s, r) => s + (Number(r.valor) || 0), 0);
}

async function getByStudent(estudiante_email) {
  const rows = await getAll();
  return rows
    .filter(r => r.estudiante_email === estudiante_email.toLowerCase())
    .map(r => ({ fecha: r.fecha, tipo: r.tipo, valor: r.valor }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

module.exports = { insertAttendance, getDailyTotal, getTotal, getByStudent };
