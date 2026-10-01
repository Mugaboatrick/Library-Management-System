const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { qrcardsDir } = require('../middleware/upload');

const QR_SECRET = process.env.QR_SECRET || 'fallback_secret_change_me';
// Accept signature from the current secret and any legacy secrets so existing printed
// QR cards keep working without being re-issued.
const LEGACY_QR_SECRETS = ['fallback_secret_change_me'];
const ALL_QR_SECRETS = [...new Set([QR_SECRET, ...LEGACY_QR_SECRETS].filter(Boolean))];

// Encrypt payload with HMAC signature to prevent spoofing
function encryptPayload(payload) {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex');
  return JSON.stringify({ data: payload, sig: signature });
}

// Decrypt and verify payload signature.
// Supports:
//  - New plain-text card format:  "First Name: ... \n Customer ID: TCH0001 ..."
//  - Encrypted format:            { data: {...}, sig: '...' } (legacy signed cards, verified)
//  - Legacy plain object format:  { customer_id, uid, ts } (from pre-encryption cards)
//  - Raw plain customer id string (e.g. "STU0001")
function decryptPayload(encrypted) {
  // Normalize scan noise BEFORE any parsing:
  //  - convert CRLF to LF (phones/browsers may scan \r\n into the text)
  //  - remove hidden zero-width characters sometimes injected by scanners
  //  - preserve line breaks so the label:value payload remains parseable
  const normalized = String(encrypted || '')
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();

  try {
    const parsed = JSON.parse(normalized);

    // Legacy encrypted format
    if (parsed && parsed.data && parsed.sig) {
      const data = JSON.stringify(parsed.data);
      const valid = ALL_QR_SECRETS.some(
        (secret) => parsed.sig === crypto.createHmac('sha256', secret).update(data).digest('hex')
      );
      if (!valid) return null;
      return parsed.data;
    }

    // Legacy plain object format
    if (parsed && parsed.customer_id) {
      return parsed;
    }

    return null;
  } catch {
    const trimmed = normalized;

    // Some phone scanners flatten the payload into one line.
    const labelMatches = [...trimmed.matchAll(/([A-Za-z][A-Za-z ]+?)\s*:\s*([^\n]+)/g)];
    if (labelMatches.length > 0) {
      const map = {};
      for (const [, label, value] of labelMatches) {
        const key = label.trim().replace(/\s+/g, '_').toLowerCase();
        map[key] = value.trim();
      }
      const id = map.customer_id;
      if (id && /^(STU|TCH|GST|LIB)\d+$/i.test(id)) {
        return { ...map, customer_id: id.toUpperCase() };
      }
    }

    // New plain-text member card format: labeled lines, e.g. "Customer ID: TCH0001"
    if (/Customer ID:/i.test(trimmed)) {
      const map = {};
      for (const line of trimmed.split('\n')) {
        const m = line.match(/^([A-Za-z ]+):\s*(.*)\s*$/);
        if (m) map[m[1].trim().replace(/\s+/g, '_').toLowerCase()] = m[2].trim();
      }
      const id = map.customer_id;
      if (id && /^(STU|TCH|GST|LIB)\d+$/i.test(id)) {
        return { ...map, customer_id: id.toUpperCase() };
      }
      return null;
    }

    // Legacy raw plain customer id string
    if (/^(STU|TCH|GST|LIB)\d+$/i.test(trimmed)) {
      return { customer_id: trimmed.toUpperCase() };
    }
    return null;
  }
}

function formatCreatedDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US'); // e.g. 9/17/2026
}

// QR generation for customer access cards.
// Keep the QR payload minimal and deterministic: a plain member ID is the most
// reliable input for phone cameras and browser scanners during login.
async function generateCustomerQR(customerId, userId, info = {}) {
  const payload = String(customerId || '').trim();

  const filename = `${customerId}_${Date.now()}.png`;
  const filepath = path.join(qrcardsDir, filename);

  await QRCode.toFile(filepath, payload, {
    width: 600,
    margin: 3,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H'
  });

  return {
    url: `/uploads/qrcards/${filename}`,
    filepath,
    data: payload
  };
}

// Generate QR for a book/ebook (unencrypted, metadata only)
async function generateBookQR(bookId, isbn) {
  const payload = JSON.stringify({ type: 'book', book_id: bookId, isbn });
  const dataUrl = await QRCode.toDataURL(payload, { width: 300 });
  return dataUrl;
}

module.exports = { generateCustomerQR, generateBookQR, decryptPayload };
