// Compact, human-printable payload carried by a book barcode label.
//
//   HH1|<copyCode>|<title>|<author>|<category>|<subject>|<level>|<shelf>
//
// The first field is the copy code, so a scan resolves the exact physical copy
// without a second lookup. The remaining fields are the book metadata the admin
// entered on the Add Hard Book form, printed under the barcode as text.
//
// Every field is capped so the 1-D Code128 stays narrow enough to scan off a
// book spine. Over-long values are truncated, and the truncation is reported so
// the UI can warn rather than silently lose data.

const PREFIX = 'HH1';
const SEP = '|';

// Order is part of the wire format. Appending is safe; reordering is not.
const FIELDS = [
  { key: 'copy_code', max: 30 },
  { key: 'title', max: 28 },
  { key: 'author', max: 18 },
  // "Reference Books" is 15 characters and is a real category in this system,
  // so 10 silently truncated it to "Reference" and the label lied.
  { key: 'category', max: 16 },
  { key: 'subject', max: 16 },
  { key: 'grade_level', max: 4 },
  { key: 'shelf_location', max: 12 }
];

const MAX_PAYLOAD = 200;

const clean = (value, max) => {
  const flat = String(value === null || value === undefined ? '' : value)
    .replace(/\s+/g, ' ')
    // The separator and the prefix marker must never appear inside a field or
    // the payload becomes ambiguous to parse.
    .replace(/\|/g, ' ')
    .replace(/^HH1/, ' ')
    .trim();
  const truncated = flat.length > max;
  return { value: flat.slice(0, max), truncated };
};

const encode = (meta = {}) => {
  const parts = [];
  const truncated = [];
  for (const f of FIELDS) {
    const r = clean(meta[f.key], f.max);
    if (r.truncated) truncated.push(f.key);
    parts.push(r.value);
  }
  const payload = PREFIX + SEP + parts.join(SEP);
  return { payload, truncated };
};

const parse = (raw) => {
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!text.toUpperCase().startsWith(PREFIX + SEP)) return null;

  const parts = text.slice(PREFIX.length + 1).split(SEP);
  if (parts.length !== FIELDS.length) return null;

  const out = { version: PREFIX };
  FIELDS.forEach((f, i) => {
    out[f.key] = parts[i].trim();
  });
  if (!out.copy_code) return null;
  return out;
};

module.exports = {
  PREFIX,
  SEP,
  FIELDS,
  MAX_PAYLOAD,
  encode,
  parse,
  isPayload: (raw) => parse(raw) !== null
};
