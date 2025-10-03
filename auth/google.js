const { OAuth2Client } = require('google-auth-library');
const config = require('../config');

const client = new OAuth2Client(config.google.clientId);

async function verifyIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });
  const payload = ticket.getPayload();

  if (config.google.allowedDomains.length) {
    const hd = payload.hd || (payload.email || '').split('@')[1];
    if (!config.google.allowedDomains.includes(hd)) {
      const err = new Error('Dominio no permitido');
      err.status = 403;
      throw err;
    }
  }

  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    hd: payload.hd,
    sub: payload.sub,
  };
}

module.exports = { verifyIdToken };
