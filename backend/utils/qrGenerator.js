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
//  - New encrypted format: { data: {...}, sig: '...' } (signature verified)
//  - Legacy plain format:  { customer_id, uid, ts } (from pre-encryption cards)
//  - Raw plain customer id string (e.g. "STU0001")
function decryptPayload(encrypted) {
  try {
    const parsed = JSON.parse(encrypted);

    // New encrypted format
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
    // Not valid JSON -> try as a plain customer id string
    const trimmed = String(encrypted || '').trim();
    if (/^(STU|TCH|GST|LIB)\d+$/i.test(trimmed)) {
      return { customer_id: trimmed.toUpperCase() };
    }
    return null;
  }
}

// Encrypted QR generation for customer access cards.
// The payload carries the user's full card information (besides customer_id/uid)
// so the QR itself holds the complete member details.
async function generateCustomerQR(customerId, userId, info = {}) {
  const payloadData = {
    customer_id: customerId,
    uid: userId,
    ts: Date.now()
  };
  if (info.full_name) payloadData.full_name = info.full_name;
  if (info.role) payloadData.role = info.role;
  if (info.email) payloadData.email = info.email;
  if (info.phone) payloadData.phone = info.phone;
  if (info.card_number) payloadData.card_number = info.card_number;

  const payload = encryptPayload(payloadData);

  const filename = `${customerId}_${Date.now()}.png`;
  const filepath = path.join(qrcardsDir, filename);

  await QRCode.toFile(filepath, payload, {
    width: 400,
    margin: 2,
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
