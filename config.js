require('dotenv').config();

const toList = (s) => (s ? s.split(',').map(x => x.trim()).filter(Boolean) : []);

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    allowedDomains: toList(process.env.ALLOWED_GOOGLE_DOMAINS),
  },
  roles: {
    teacherEmails: new Set(toList(process.env.TEACHER_EMAILS)),
  },
  storage: {
    backend: (process.env.STORAGE_BACKEND || 'SHEETS').toUpperCase(),
    sheets: {
      sheetId: process.env.GOOGLE_SHEETS_ID,
      serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || './service-account.json',
    },
    mysql: {
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'asistencias',
    }
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    from: process.env.EMAIL_FROM || 'Notificaciones <no-reply@example.com>',
    ccAdmin: process.env.EMAIL_CC_ADMIN || '',
    thresholds: toList(process.env.THRESHOLDS).map(Number),
  },
  business: {
    tipos: {
      TARDE: 0.5,
      AUSENTE: 1,
      AUSENTE_NO_COMPUTABLE: 0,
      AUSENTE_ED_FISICA: 0.5,
      RETIRO_ANTICIPADO: 0.5,
    }
  }
};
