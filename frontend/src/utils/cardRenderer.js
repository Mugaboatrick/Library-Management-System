// Draws a full library access card (header + member info + QR) on a canvas
// and exports it as a PNG data URL. Avoids canvas tainting by loading
// images through blobs, so data URLs and /uploads URLs both work.
//
// The QR symbol deliberately carries ONLY the member ID. A plain serial is the
// most reliable thing for a phone camera to read at the library desk, and the
// QR image is a public file under /uploads/qrcards, so anything encoded in it
// is readable by anyone who copies the card. The owner's full details are
// therefore PRINTED as readable text beside it instead of being encoded.
//
// The account password is never accepted here and never drawn. Printing a
// credential on a card would expose the member's login to anyone who sees it.
const loadImageAsync = (src) => new Promise((resolve) => {
  fetch(src)
    .then((r) => r.ok ? r.blob() : Promise.reject())
    .then((blob) => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    })
    .catch(() => resolve(null));
});

export const buildLibraryCardDataUrl = async ({ qrUrl, customerId, name, roleLabel, cardNumber, email, phone, className }) => {
  // Enlarged layout: the QR now takes ~60% of the card width (~440px of 760px)
  // so printed cards scan reliably from a phone, like the paper test card.
  const W = 760, H = 540;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Card body
  roundRect(0, 0, W, H, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Header band
  roundRect(6, 6, W - 12, 78, 12);
  const grad = ctx.createLinearGradient(0, 6, 0, 84);
  grad.addColorStop(0, '#9CCB3C');
  grad.addColorStop(1, '#7CB342');
  ctx.fillStyle = grad;
  ctx.fill();

  // Logo
  const logo = await loadImageAsync('/hope-logo.png');
  if (logo) ctx.drawImage(logo, 26, 18, 54, 54);

  // School name
  const textBaseX = logo ? 94 : 26;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('Hope Haven School Library', textBaseX, 40);
  ctx.font = '13px Arial, sans-serif';
  ctx.fillStyle = '#fff7d6';
  ctx.fillText('Smart Library Access Card', textBaseX, 62);

  // Member chip
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText('MEMBER', W - 92, 36);
  ctx.fillStyle = '#fef3c7';
  ctx.font = '10px Arial, sans-serif';
  ctx.fillText(cardNumber || '', W - 92, 52);

  // QR code (right side, ~60% of card width)
  const qr = await loadImageAsync(qrUrl);
  const qrSize = 440;
  const qrX = W - qrSize - 22, qrY = 88;
  roundRect(qrX, qrY, qrSize, qrSize, 10);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  if (qr) ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  // Member details (left column, below the band)
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText('LIBRARY MEMBER', 30, 140);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px Consolas, monospace';
  ctx.fillText((customerId || '').toUpperCase(), 30, 178);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText((name || '').trim(), 30, 212);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText(roleLabel || '', 30, 234);

  // Owner details, printed rather than encoded. The left column ends where the
  // QR block begins, so every line is clipped to that width to keep a long
  // email or phone number from running underneath the QR.
  const leftEdge = 30;
  const leftWidth = W - qrSize - 8 - leftEdge;

  // Long values are shortened with an ellipsis so the layout never breaks.
  const fit = (value, maxWidth) => {
    const text = String(value === null || value === undefined ? '' : value).trim();
    if (!text || ctx.measureText(text).width <= maxWidth) return text;
    let out = text;
    while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) out = out.slice(0, -1);
    return out + '…';
  };

  // Each field is a small caps label with its value underneath. Fields with no
  // value are skipped rather than printing an empty label.
  const detail = (label, value, top) => {
    const text = fit(value, leftWidth);
    if (!text) return top;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText(label, leftEdge, top);
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(text, leftEdge, top + 17);
    return top + 38;
  };

  // Separator above the contact block, only when there is something to show.
  const contactRows = [
    ['EMAIL', email],
    ['PHONE', phone],
    ['CLASS / GRADE', className]
  ].filter(([, v]) => String(v === null || v === undefined ? '' : v).trim());

  if (contactRows.length) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftEdge, 262);
    ctx.lineTo(leftEdge + leftWidth, 262);
    ctx.stroke();

    let y = 284;
    for (const [label, value] of contactRows) {
      y = detail(label, value, y);
    }
  }

  // Bottom strip (left side only, QR occupies the right)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 498); ctx.lineTo(W - qrSize - 8, 498);
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('Hope Haven School Library • Member ID card', 30, 522);
  ctx.fillText('Present this card to sign in at the library', 30, 537);

  return canvas.toDataURL('image/png');
};

export const downloadCardImage = (dataUrl, filename) => {
  if (!dataUrl) return false;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};