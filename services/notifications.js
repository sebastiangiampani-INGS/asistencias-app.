const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: config.mail.auth.user ? { user: config.mail.auth.user, pass: config.mail.auth.pass } : undefined,
    });
  }
  return transporter;
}

function mustNotify(prevTotal, newTotal) {
  for (const t of config.mail.thresholds) {
    if (prevTotal < t && newTotal >= t) return t;
  }
  return null;
}

async function sendThresholdEmail({ to, cc, studentEmail, threshold, total }) {
  if (!config.mail.host) return;
  const tr = getTransporter();
  const subject = `Aviso de inasistencias: alcanzaste ${threshold}`;
  const html = `
    <p>Hola,</p>
    <p>El total de inasistencias para <b>${studentEmail}</b> alcanzó <b>${total}</b>.</p>
    <p>Umbral alcanzado: <b>${threshold}</b></p>
  `;
  await tr.sendMail({
    from: config.mail.from,
    to,
    cc: cc || undefined,
    subject,
    html,
  });
}

module.exports = { mustNotify, sendThresholdEmail };
