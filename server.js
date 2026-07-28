/**
 * Gofa Bahamas — website backend
 * Serves the static site and handles booking / contact form submissions,
 * emailing them to the address configured in .env (TO_EMAIL).
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const TO_EMAIL = process.env.TO_EMAIL || 'gofabahamas@gmail.com';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the static website (index.html, images, 404, etc.) from this folder
app.use(express.static(__dirname));

// --- Email transport -------------------------------------------------------
// Reads SMTP settings from .env. For Gmail, create an "App Password" and use:
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_USER=you@gmail.com  SMTP_PASS=app-password
function makeTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // not configured yet
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendMail(subject, text, replyTo) {
  const transport = makeTransport();
  if (!transport) {
    console.warn('[gofa] SMTP not configured — logging submission instead:\n', text);
    return { logged: true };
  }
  await transport.sendMail({
    from: `"Gofa Website" <${process.env.SMTP_USER}>`,
    to: TO_EMAIL,
    replyTo: replyTo || undefined,
    subject,
    text,
  });
  return { sent: true };
}

function clean(v) {
  return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, 500);
}

// --- Booking endpoint ------------------------------------------------------
app.post('/api/booking', async (req, res) => {
  try {
    const { name, email, tour, date, guests } = req.body;
    if (!clean(name) || !clean(email)) {
      return res.status(400).json({ ok: false, error: 'Name and email are required.' });
    }
    const body = [
      'NEW BOOKING REQUEST — Gofa Bahamas',
      '----------------------------------',
      `Name:   ${clean(name)}`,
      `Email:  ${clean(email)}`,
      `Tour:   ${clean(tour) || '(not specified)'}`,
      `Date:   ${clean(date) || '(not specified)'}`,
      `Guests: ${clean(guests) || '(not specified)'}`,
    ].join('\n');
    const result = await sendMail('New Booking Request — Gofa Bahamas', body, clean(email));
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[gofa] booking error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send your request. Please call us.' });
  }
});

// --- Contact endpoint ------------------------------------------------------
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!clean(name) || !clean(email) || !clean(message)) {
      return res.status(400).json({ ok: false, error: 'Name, email and message are required.' });
    }
    const body = [
      'NEW CONTACT MESSAGE — Gofa Bahamas',
      '----------------------------------',
      `Name:  ${clean(name)}`,
      `Email: ${clean(email)}`,
      `Phone: ${clean(phone) || '(not provided)'}`,
      '',
      'Message:',
      clean(message),
    ].join('\n');
    const result = await sendMail('New Contact Message — Gofa Bahamas', body, clean(email));
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[gofa] contact error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send your message. Please call us.' });
  }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'gofa-bahamas' }));

// Custom 404 for non-API routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Gofa Bahamas site running at http://localhost:${PORT}`);
});
