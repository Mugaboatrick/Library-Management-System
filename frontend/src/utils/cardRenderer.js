// Draws a full library access card (header + member info + QR) on a canvas
// and exports it as a PNG data URL. Avoids canvas tainting by loading
// images through blobs, so data URLs and /uploads URLs both work.

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

export const buildLibraryCardDataUrl = async ({ qrUrl, customerId, name, roleLabel, cardNumber }) => {
  const W = 640, H = 400;
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
  roundRect(6, 6, W - 12, 96, 12);
  const grad = ctx.createLinearGradient(0, 6, 0, 102);
  grad.addColorStop(0, '#12305e');
  grad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = grad;
  ctx.fill();

  // Logo
  const logo = await loadImageAsync('/hope-logo.png');
  if (logo) ctx.drawImage(logo, 26, 26, 56, 56);

  // School name
  const textBaseX = logo ? 96 : 26;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('Hope Haven School Library', textBaseX, 46);
  ctx.font = '13px Arial, sans-serif';
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Smart Library Access Card', textBaseX, 68);

  // Member chip
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('MEMBER', W - 92, 42);
  ctx.fillStyle = '#e0e7ff';
  ctx.font = '10px Arial, sans-serif';
  ctx.fillText(cardNumber || '', W - 92, 58);

  // QR code (right side)
  const qr = await loadImageAsync(qrUrl);
  const qrSize = 170;
  const qrX = W - qrSize - 34, qrY = 132;
  roundRect(qrX, qrY, qrSize, qrSize, 10);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  if (qr) ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  // Member details (left side)
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText('LIBRARY MEMBER', 34, 150);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px Consolas, monospace';
  ctx.fillText((customerId || '').toUpperCase(), 34, 188);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText((name || '').trim(), 34, 224);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(roleLabel || '', 34, 248);

  // Bottom strip
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(34, 336); ctx.lineTo(W - 34, 336);
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('Hope Haven School Library • Member ID card — present at the library desk', 34, 362);

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