// node test/test.js
// 1. SHA-256 against Node's implementation, including padding boundaries.
// 2. Betti numbers from the persistence pairs against a brute-force rank computation over GF(2)
//    on the full Vietoris–Rips complex (vertices, edges, triangles, tetrahedra) at several scales.
'use strict';
const assert = require('assert');
const nodeCrypto = require('crypto');
const { sha256, hex, mulberry32, Lamp } = require('./core.js');

// ---- SHA-256 ----
{
  const enc = new TextEncoder();
  const want = (b) => nodeCrypto.createHash('sha256').update(b).digest('hex');
  for (const v of ['', 'abc', 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq']) {
    assert.strictEqual(hex(sha256(enc.encode(v))), want(v), `sha256(${JSON.stringify(v)})`);
  }
  for (const len of [55, 56, 63, 64, 65, 119, 120, 127, 128, 1000, 65536, 100000]) {
    const buf = nodeCrypto.randomBytes(len);
    assert.strictEqual(hex(sha256(new Uint8Array(buf))), want(buf), `sha256 of ${len} random bytes`);
  }
  console.log('sha256: ok');
}

// ---- persistent homology ----
function rankGF2(rows) {
  // rows are BigInt bitmasks; pivots keep distinct highest bits
  const piv = new Map(); // highest bit -> row
  let rank = 0;
  for (let r of rows) {
    while (r) {
      const hb = r.toString(2).length;
      const p = piv.get(hb);
      if (!p) { piv.set(hb, r); rank++; break; }
      r ^= p;
    }
  }
  return rank;
}
function bruteBetti(P, eps) {
  const n = P.length;
  const near = (i, j) => Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) <= eps;
  const edges = [], eid = new Map();
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (near(i, j)) { eid.set(`${i},${j}`, edges.length); edges.push([i, j]); }
  const tris = [], tid = new Map();
  for (const [i, j] of edges) for (let k = j + 1; k < n; k++) if (eid.has(`${j},${k}`) && eid.has(`${i},${k}`)) { tid.set(`${i},${j},${k}`, tris.length); tris.push([i, j, k]); }
  const tets = [];
  for (const [i, j, k] of tris) for (let l = k + 1; l < n; l++) if (eid.has(`${i},${l}`) && eid.has(`${j},${l}`) && eid.has(`${k},${l}`)) tets.push([i, j, k, l]);
  const bit = (x) => 1n << BigInt(x);
  const d1 = edges.map(([i, j]) => bit(i) | bit(j));
  const d2 = tris.map(([i, j, k]) => bit(eid.get(`${i},${j}`)) | bit(eid.get(`${j},${k}`)) | bit(eid.get(`${i},${k}`)));
  const d3 = tets.map(([i, j, k, l]) => bit(tid.get(`${j},${k},${l}`)) | bit(tid.get(`${i},${k},${l}`)) | bit(tid.get(`${i},${j},${l}`)) | bit(tid.get(`${i},${j},${k}`)));
  const r1 = rankGF2(d1), r2 = rankGF2(d2), r3 = rankGF2(d3);
  return [n - r1, edges.length - r1 - r2, tris.length - r2 - r3];
}
{
  let checks = 0;
  for (let trial = 0; trial < 60; trial++) {
    const lamp = new Lamp(0, null, mulberry32(1000 + trial));
    for (let k = 0; k < 200; k++) lamp.step(1 / 30, k / 30);   // let the wax clump
    lamp.computePH();
    for (const eps of [0.08, 0.12, 0.17, 0.22, 0.27, 0.32]) {
      const [b0, b1] = lamp.betti(eps);
      const [B0, B1] = bruteBetti(lamp.pts, eps);
      assert.deepStrictEqual([b0, b1], [B0, B1], `trial ${trial}, eps ${eps}: betti from pairs ${[b0, b1]} vs brute force ${[B0, B1]}`);
      checks++;
    }
  }
  console.log(`persistent homology: ok (${checks} scale checks agree with brute force)`);
}
