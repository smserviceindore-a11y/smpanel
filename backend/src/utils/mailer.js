const nodemailer = require('nodemailer');

let transporter;
let lastSmtpKey = '';

const clearMailerCache = () => {
  transporter = null;
  lastSmtpKey = '';
};

const buildDemoTransporter = () => ({
  sendMail: async (opts) => {
    console.log('\n[email:demo]', {
      to: opts.to,
      subject: opts.subject,
      text: opts.text?.slice?.(0, 200),
    });
    return { messageId: `demo-${Date.now()}` };
  },
});

const getTransporter = async () => {
  let cfg;
  try {
    cfg = await require('../services/settings.service').getSmtpConfig();
  } catch {
    cfg = null;
  }

  if (cfg?.enabled && cfg.host && cfg.user) {
    const key = `${cfg.host}|${cfg.port}|${cfg.user}|${cfg.pass}|${cfg.secure}`;
    if (transporter && lastSmtpKey === key) return transporter;
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    lastSmtpKey = key;
    return transporter;
  }

  // Env fallback without DB
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const key = `env|${process.env.SMTP_HOST}|${process.env.SMTP_USER}`;
    if (transporter && lastSmtpKey === key) return transporter;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    lastSmtpKey = key;
    return transporter;
  }

  if (!transporter || lastSmtpKey !== 'demo') {
    transporter = buildDemoTransporter();
    lastSmtpKey = 'demo';
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return null;
  let from = process.env.MAIL_FROM || 'SM Global Hub <noreply@smglobalhub.local>';
  try {
    const cfg = await require('../services/settings.service').getSmtpConfig();
    if (cfg?.from) from = cfg.from;
  } catch {
    /* keep env from */
  }
  const tx = await getTransporter();
  return tx.sendMail({ from, to, subject, text, html });
};

module.exports = { sendEmail, clearMailerCache };
