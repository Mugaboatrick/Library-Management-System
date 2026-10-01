// Mirror of backend/utils/barcodePayload.js. The payload format is part of the
// label contract: anything printed on a book spine must decode to the same
// fields the Borrow/Return resolver expects, so both sides must stay identical.
//
//   HH1|<copyCode>|<title>|<author>|<category>|<subject>|<level>|<shelf>

export const BARCODE_PREFIX = 'HH1';
export const BARCODE_SEP = '|';

export const BARCODE_FIELDS = [
  { key: 'copy_code', label: 'Copy code', max: 30 },
  { key: 'title', label: 'Title', max: 28 },
  { key: 'author', label: 'Author', max: 18 },
  { key: 'category', label: 'Category', max: 16 },
  { key: 'subject', label: 'Subject', max: 16 },
  { key: 'grade_level', label: 'Level', max: 4 },
  { key: 'shelf_location', label: 'Shelf location', max: 12 }
];

const clean = (value, max) => {
  const flat = String(value === null || value === undefined ? '' : value)
    .replace(/\s+/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/^HH1/, ' ')
    .trim();
  return { value: flat.slice(0, max), truncated: flat.length > max };
};

export const encodeBarcodePayload = (meta = {}) => {
  const parts = [];
  const truncated = [];
  for (const f of BARCODE_FIELDS) {
    const r = clean(meta[f.key], f.max);
    if (r.truncated) truncated.push(f.key);
    parts.push(r.value);
  }
  return { payload: BARCODE_PREFIX + BARCODE_SEP + parts.join(BARCODE_SEP), truncated };
};

export const parseBarcodePayload = (raw) => {
  const text = String(raw || '').trim();
  if (!text.toUpperCase().startsWith(BARCODE_PREFIX + BARCODE_SEP)) return null;
  const parts = text.slice(BARCODE_PREFIX.length + 1).split(BARCODE_SEP);
  if (parts.length !== BARCODE_FIELDS.length) return null;
  const out = { version: BARCODE_PREFIX };
  BARCODE_FIELDS.forEach((f, i) => {
    out[f.key] = parts[i].trim();
  });
  return out.copy_code ? out : null;
};
