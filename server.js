const express = require('express');
const path = require('path');
const config = require('./config');
const { verifyIdToken } = require('./auth/google');
const db = require('./db');
const { mustNotify, sendThresholdEmail } = require('./services/notifications');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS en carpeta public)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticación con Google
async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Falta Authorization: Bearer <id_token>' });
    const user = await verifyIdToken(token);
    req.user = user;
    req.user.role = config.roles.teacherEmails.has(user.email) ? 'teacher' : 'student';
    next();
  } catch (e) {
    console.error('Auth error', e);
    res.status(e.status || 401).json({ error: e.message || 'No autorizado' });
  }
}

// Endpoints
app.get('/api/config', (_req, res) => {
  res.json({ googleClientId: config.google.clientId });
});

app.get('/api/tipos', (_req, res) => {
  res.json(config.business.tipos);
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ email: req.user.email, name: req.user.name, role: req.user.role });
});

app.get('/api/mis-asistencias', authMiddleware, async (req, res) => {
  const email = req.user.email.toLowerCase();
  const rows = await db.getByStudent(email);
  const total = rows.reduce((s, r) => s + Number(r.valor || 0), 0);
  res.json({ items: rows, total });
});

app.post('/api/asistencias', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Solo docentes pueden cargar asistencias' });
    const { fecha, estudiante_email, tipo } = req.body;
    if (!fecha || !estudiante_email || !tipo) return res.status(400).json({ error: 'fecha, estudiante_email y tipo son obligatorios' });

    const tipos = config.business.tipos;
    if (!tipos[tipo]) {
      if (!(tipo in tipos)) return res.status(400).json({ error: 'Tipo inválido' });
    }
    const valor = tipos[tipo];

    // Validar tope diario
    const daily = await db.getDailyTotal(estudiante_email, fecha);
    if (daily + valor > 1) {
      return res.status(400).json({
        error: `Tope diario superado: ya tiene ${daily}, agregar ${valor} excede 1`
      });
    }

    // Guardar
    await db.insertAttendance({
      fecha,
      estudiante_email: estudiante_email.toLowerCase(),
      tipo,
      valor,
      docente_email: req.user.email,
    });

    // Notificaciones
    const prevTotal = await db.getTotal(estudiante_email) - valor;
    const newTotal = prevTotal + valor;
    const threshold = mustNotify(prevTotal, newTotal);
    if (threshold) {
      sendThresholdEmail({
        to: estudiante_email,
        cc: config.mail.ccAdmin,
        studentEmail: estudiante_email,
        threshold,
        total: newTotal,
      }).catch(err => console.error('Email error', err));
    }

    res.json({ ok: true, valor, message: 'Asistencia cargada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.listen(config.port, () => {
  console.log(`Servidor escuchando en ${config.baseUrl}`);
});
