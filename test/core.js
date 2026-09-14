// Pulls the math out of index.html so it can run in Node without a DOM.
// Sections are located by their "// ----------" comment headers, not line numbers.
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function section(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error(`could not find section ${startMarker}`);
  return src.slice(a, b);
}
const code = [
  'const TAU = Math.PI * 2;',
  'const clamp = (v, a, b) => Math.min(b, Math.max(a, v));',
  section('// ---------- SHA-256', '// ---------- seeded randomness'),
  section('// ---------- seeded randomness', '// ---------- byte sink'),
  section('// ---------- the classic lamp silhouette', '// ---------- lamp geometry'),
  'return { sha256, hex, mulberry32, Lamp, RMAX, N_PTS, A, halfWidth };',
].join('\n');
module.exports = new Function('crypto', code)(require('crypto').webcrypto || require('crypto'));
