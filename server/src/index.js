import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import { validateAadhaar, validateName, validatePAN, normalizePAN } from './validation.js';
import { schema } from './schema.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());


const otpStore = new Map();

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/schema', (req, res) => {
  res.json(schema);
});

app.post('/api/otp/generate', (req, res) => {
  const { aadhaarNumber, nameAsPerAadhaar, declarationConsent } = req.body || {};
  const errors = {};
  if (!validateAadhaar(aadhaarNumber)) errors.aadhaarNumber = 'Aadhaar must be 12 digits';
  if (!validateName(nameAsPerAadhaar)) errors.nameAsPerAadhaar = 'Name should be alphabetic (min 3 chars)';
  if (!declarationConsent) errors.declarationConsent = 'You must agree before continuing';
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

  
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const token = Math.random().toString(36).slice(2);
  otpStore.set(token, { otp, verified: false, payload: { aadhaarNumber, nameAsPerAadhaar } });

  res.json({
    ok: true,
    token,
    
    otp: process.env.NODE_ENV === 'production' ? undefined : otp
  });
});

app.post('/api/otp/verify', (req, res) => {
  const { token, otp } = req.body || {};
  const record = otpStore.get(token);
  if (!record) return res.status(400).json({ ok: false, error: 'Invalid token' });
  if (record.otp !== String(otp)) return res.status(400).json({ ok: false, error: 'Incorrect OTP' });
  record.verified = true;
  otpStore.set(token, record);
  res.json({ ok: true });
});

app.post('/api/validate/pan', (req, res) => {
  const { panNumber } = req.body || {};
  const pan = normalizePAN(panNumber || '');
  if (!validatePAN(pan)) return res.status(400).json({ ok: false, error: 'Invalid PAN format' });
  res.json({ ok: true, pan });
});

app.post('/api/submit', async (req, res) => {
  const { token, panNumber } = req.body || {};
  const pan = normalizePAN(panNumber || '');
  const record = otpStore.get(token);
  if (!record || !record.verified) return res.status(400).json({ ok: false, error: 'OTP not verified' });
  if (!validatePAN(pan)) return res.status(400).json({ ok: false, error: 'Invalid PAN format' });

  const { aadhaarNumber, nameAsPerAadhaar } = record.payload;
  try {
    const saved = await prisma.submission.create({
      data: { aadhaarNumber, nameAsPerAadhaar, panNumber: pan }
    });
    res.json({ ok: true, id: saved.id });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
