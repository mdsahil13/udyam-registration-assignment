/**
 * Attempts to scrape field labels + inputs for Steps 1 & 2 of Udyam Registration.
 * If the target page blocks automation, it will fall back to a hard-coded schema.
 * Output: ./out/schema.json
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const OUT_DIR = path.join(process.cwd(), 'out');
const OUT_FILE = path.join(OUT_DIR, 'schema.json');

const fallbackSchema = {
  meta: {
    title: "Udyam Registration — Steps 1 & 2",
    version: "1.0.0",
    source: "https://udyamregistration.gov.in/UdyamRegistration.aspx"
  },
  steps: [
    {
      key: "aadhaar_otp",
      title: "Aadhaar Verification (OTP)",
      fields: [
        { key: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true, placeholder: "12-digit Aadhaar", validation: { regex: "^\\d{12}$", message: "Aadhaar must be 12 digits" } },
        { key: "nameAsPerAadhaar", label: "Name of Entrepreneur (as per Aadhaar)", type: "text", required: true, placeholder: "Your full name", validation: { regex: "^[A-Za-z ]{3,}$", message: "Name should be alphabetic (min 3 chars)" } },
        { key: "declarationConsent", label: "I agree and authorize Aadhaar OTP verification", type: "checkbox", required: true }
      ],
      actions: [
        { key: "generateOtp", label: "Validate & Generate OTP", endpoint: "/api/otp/generate" },
        { key: "verifyOtp", label: "Verify OTP", endpoint: "/api/otp/verify" }
      ]
    },
    {
      key: "pan_validation",
      title: "PAN Verification",
      fields: [
        { key: "panNumber", label: "PAN Number", type: "text", required: true, placeholder: "ABCDE1234F", validation: { regex: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message: "PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)" } }
      ],
      actions: [
        { key: "validatePan", label: "Validate PAN", endpoint: "/api/validate/pan" },
        { key: "submit", label: "Submit", endpoint: "/api/submit" }
      ]
    }
  ]
};

async function run() {
  let schema = fallbackSchema;
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    // Government site (may block automation / strict CSP)
    await page.goto('https://udyamregistration.gov.in/UdyamRegistration.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Try to approximate first-step fields (names, labels)
    const fields = await page.evaluate(() => {
      // crude heuristic: look for inputs near "Aadhaar" text
      const result = [];
      const inputEls = Array.from(document.querySelectorAll('input, select, textarea'));
      for (const el of inputEls) {
        const label = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
        const text = (label?.textContent || '').trim();
        const ph = (el.getAttribute('placeholder') || '').trim();
        const type = (el.getAttribute('type') || el.tagName.toLowerCase());
        if (/aadhaar|aadhar/i.test(text + ' ' + ph)) {
          result.push({ key: 'aadhaarNumber', label: text || 'Aadhaar Number', type: 'text' });
        } else if (/entrepreneur|name/i.test(text + ' ' + ph)) {
          result.push({ key: 'nameAsPerAadhaar', label: text || 'Name of Entrepreneur (as per Aadhaar)', type: 'text' });
        }
      }
      return result;
    });

    if (fields && fields.length >= 2) {
      schema = JSON.parse(JSON.stringify(fallbackSchema)); // clone
      // use discovered labels if present
      for (const f of schema.steps[0].fields) {
        const match = fields.find(x => x.key === f.key);
        if (match && match.label) f.label = match.label;
      }
    }

    await browser.close();
  } catch (err) {
    // swallow errors and use fallback
  } finally {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(schema, null, 2), 'utf-8');
    console.log(`Schema written to ${OUT_FILE}`);
  }
}

run();
