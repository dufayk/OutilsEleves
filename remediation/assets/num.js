/* =====================================================================
   Remédiation Physique Chimie – outils numériques partagés (sans DOM)
   Utilisables par toutes les notions : nombres décimaux {digits, power},
   lecture de la réponse de l'élève, correction des questions.
   Types de questions : 'qcm' (options, correct), 'int' (answer), 'num' (exp, requireSci, unit)
   ===================================================================== */
(function (root) {
'use strict';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const MINUS = '−';

/* digits : chiffres significatifs (le 1er est non nul), power : puissance de 10 du 1er chiffre */
function lastPow(d) { return d.power - d.digits.length + 1; }
function value(d) { return parseFloat(d.digits[0] + '.' + (d.digits.slice(1) || '0') + 'e' + d.power); }
function supPow(p) { return '10<sup>' + (p < 0 ? MINUS + (-p) : p) + '</sup>'; }
function fmtDec(d) {
  if (d.power >= 0) {
    const ip = d.digits.slice(0, d.power + 1).padEnd(d.power + 1, '0');
    const fp = d.digits.slice(d.power + 1);
    return fp ? ip + ',' + fp : ip;
  }
  return '0,' + '0'.repeat(-d.power - 1) + d.digits;
}
function fmtSci(d) {
  const m = d.digits[0] + (d.digits.length > 1 ? ',' + d.digits.slice(1) : '');
  return m + '×' + supPow(d.power);
}
function decIsAmbiguous(d) { const lp = lastPow(d); return lp > 0 || (lp === 0 && d.digits.length > 1 && d.digits.endsWith('0')); }
function needsSci(d) { return d.power >= 6 || d.power <= -5 || decIsAmbiguous(d); }
function fmt(d, mode) {
  if (mode === 'sci') return fmtSci(d);
  if (mode === 'dec') return fmtDec(d);
  return needsSci(d) ? fmtSci(d) : fmtDec(d);
}
function roundDigits(d, n) {
  const digs = d.digits;
  if (digs.length <= n) return { digits: digs.padEnd(n, '0'), power: d.power };
  let head = digs.slice(0, n).split('').map(Number);
  let power = d.power;
  if (+digs[n] >= 5) {
    let i = n - 1;
    while (i >= 0) { if (head[i] === 9) { head[i] = 0; i--; } else { head[i]++; break; } }
    if (i < 0) { head = [1].concat(head.slice(0, n - 1)); power++; }
  }
  return { digits: head.join(''), power };
}
function stripZeros(d) { const s = d.digits.replace(/0+$/, ''); return { digits: s || '0', power: d.power }; }
function fromFloat(x) {
  const m = /^(\d)\.(\d+)e([+-]\d+)$/.exec(Math.abs(x).toExponential(14));
  return { digits: m[1] + m[2], power: parseInt(m[3], 10) };
}
function fromIntKeep(R, dec) { const s = String(R); return { digits: s, power: s.length - 1 - dec }; }
function showInt(R, dec) {
  const s = String(R).padStart(dec + 1, '0');
  return dec ? s.slice(0, s.length - dec) + ',' + s.slice(s.length - dec) : s;
}
function roundIntTo(R, fromDec, toDec) { const f = Math.pow(10, fromDec - toDec); return Math.floor((R + f / 2) / f); }

/* ---------- lecture de la réponse de l'élève ---------- */
const SUPMAP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
function parseNum(input) {
  let s = String(input || '').trim();
  if (!s) return { ok: false };
  s = s.replace(/^[^=]*=\s*/, '');
  s = s.replace(/[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + m.split('').map(c => SUPMAP[c]).join(''));
  s = s.replace(/[−–—]/g, '-').replace(/ | /g, ' ');
  s = s.replace(/\s*[×xX*·∙]\s*10\s*\^?\s*\(?\s*(?=[+-]?\d)/g, 'E');
  s = s.replace(/\.\s*10\s*\^\s*\(?\s*(?=[+-]?\d)/g, 'E');
  s = s.replace(/\s+10\s*\^\s*\(?\s*(?=[+-]?\d)/g, 'E');
  s = s.replace(/^(\S*?E[+-]?\d+)\)/, '$1');
  const m = /^\s*\+?(\d*)(?:[.,](\d*))?(?:[eE]([+-]?\d+))?/.exec(s);
  if (!m || (m[1] === '' && (m[2] === undefined || m[2] === ''))) return { ok: false };
  const rest = s.slice(m[0].length);
  if (rest && !/^\s*[a-zA-Zµ°%Ωρ]/.test(rest) && !/^\s+$/.test(rest)) return { ok: false };
  const ip = m[1] || '';
  const fp = m[2] === undefined ? '' : m[2];
  const hasComma = m[2] !== undefined;
  const hasExp = m[3] !== undefined;
  const exp = hasExp ? parseInt(m[3], 10) : 0;
  const full = ip + fp;
  const i = full.search(/[1-9]/);
  if (i < 0) return { ok: false, zero: true };
  const digits = full.slice(i);
  const power = ip.length - 1 - i + exp;
  const ambiguous = !hasComma && /0$/.test(ip) && digits.endsWith('0');
  const ipNz = ip.replace(/^0+/, '');
  const sciOk = hasExp && ipNz.length === 1;
  return { ok: true, digits, power, ncs: digits.length, ambiguous, sciOk, hasExp, val: value({ digits, power }) };
}
function countCS(str) { const p = parseNum(str.replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/−/g, '-')); return p.ok ? p.ncs : null; }

function htmlToText(h) {
  return String(h)
    .replace(/<svg[\s\S]*?<\/svg>/g, ' [figure] ')
    .replace(/<span class="vec">(.*?)<\/span>/g, 'vec($1)')
    .replace(/<sup>(.*?)<\/sup>/g, '^$1')
    .replace(/<br\s*\/?>|<\/?(div|p|li)[^>]*>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

/* ---------- correction ---------- */
function grade(q, input) {
  if (q.kind === 'qcm') {
    const k = input === null || input === undefined || input === '' ? -1 : +input;
    const ok = k === q.correct;
    return { ok, student: k >= 0 ? htmlToText(q.options[k]) : '(sans réponse)', msg: ok ? '' : 'La bonne réponse était : ' + q.options[q.correct] };
  }
  if (q.kind === 'int') {
    const t = String(input || '').trim();
    const n = /^\d+$/.test(t) ? parseInt(t, 10) : NaN;
    const ok = n === q.answer;
    return { ok, student: t || '(sans réponse)', msg: ok ? '' : (isNaN(n) ? 'Réponds par un nombre entier.' : 'Tu as répondu ' + n + '.') };
  }
  if (q.kind === 'val') return gradeVal(q, input);
  const raw = String(input || '').trim();
  const p = parseNum(raw);
  const E = q.exp;
  const student = raw || '(sans réponse)';
  if (!p.ok) return { ok: false, student, msg: raw ? 'Écriture non reconnue. Exemples d\'écriture acceptée : 4,70×10^-3 ou 0,00470' : 'Pas de réponse.' };
  const eVal = value(E);
  const same = Math.abs(p.val - eVal) <= 1e-9 * Math.abs(eVal);
  if (p.ambiguous) {
    return { ok: false, student, msg: (same ? 'La valeur est bonne, mais l\'écriture est ambiguë' : 'Écriture ambiguë') + ' : avec des zéros à la fin d\'un nombre entier, on ne sait pas combien il y a de chiffres significatifs. Utilise la notation scientifique.' };
  }
  if (p.digits === E.digits && p.power === E.power) {
    if (q.requireSci && !p.sciOk) return { ok: false, student, msg: 'La valeur est bonne, mais ce n\'est pas l\'écriture scientifique demandée : a×10<sup>n</sup> avec 1 ≤ a &lt; 10.' };
    return { ok: true, student, msg: '' };
  }
  const n = E.digits.length;
  if (same) return { ok: false, student, msg: 'Bonne valeur, mais ton écriture a ' + p.ncs + ' CS au lieu de ' + n + '.' };
  if (p.ncs > n) {
    const r = roundDigits(p, n);
    if (r.digits === E.digits && r.power === E.power) return { ok: false, student, msg: 'Ton résultat n\'est pas assez arrondi : il faut garder ' + n + ' CS.' };
  }
  return { ok: false, student, msg: 'Valeur incorrecte.' };
}

/* nombre signé quelconque (coordonnée, projection, produit scalaire…) : null si illisible */
function parseSigned(input) {
  let s = String(input || '').trim().replace(/^[^=]*=\s*/, '').trim().replace(/^[−–—]/, '-');
  let sign = 1;
  if (s[0] === '-') { sign = -1; s = s.slice(1).trim(); } else if (s[0] === '+') s = s.slice(1).trim();
  const p = parseNum(s);
  if (p.zero) return 0;
  return p.ok ? sign * p.val : null;
}
/* kind 'val' : valeur numérique jugée avec une tolérance (q.val, q.tol absolue ou 1 % par défaut),
   q.traps = [{val, msg}] : réponses fausses typiques avec un message ciblé */
function near(x, v, tol) { return Math.abs(x - v) <= (tol != null ? tol : Math.max(1e-12, 0.01 * Math.abs(v))) + 1e-12; }
function gradeVal(q, input) {
  const raw = String(input || '').trim();
  const student = raw || '(sans réponse)';
  const x = parseSigned(raw);
  if (x === null) return { ok: false, student, msg: raw ? 'Écriture non reconnue. Écris seulement un nombre, par exemple −3,5 ou 2,4×10^-3.' : 'Pas de réponse.' };
  if (near(x, q.val, q.tol)) return { ok: true, student, msg: '' };
  for (const t of (q.traps || [])) if (near(x, t.val, q.tol)) return { ok: false, student, msg: t.msg };
  if (q.val !== 0 && near(-x, q.val, q.tol)) return { ok: false, student, msg: q.signMsg || 'La valeur absolue est bonne, mais le signe est faux.' };
  return { ok: false, student, msg: 'Valeur incorrecte.' };
}

/* ---------- aides à la fabrication des questions ---------- */
function randDigits(n, o) {
  o = o || {};
  const inner = o.innerZero !== false;
  let d = String(ri(1, 9));
  for (let i = 1; i < n; i++) d += String(inner ? ri(0, 9) : ri(1, 9));
  if (o.forceInnerZero && n >= 3) { const k = ri(1, n - 2); d = d.slice(0, k) + '0' + d.slice(k + 1); }
  if (n > 1) {
    if (o.trailingZero) d = d.slice(0, -1) + '0';
    else if (o.lastNonZero !== false && d.endsWith('0')) d = d.slice(0, -1) + String(ri(1, 9));
  }
  return d;
}
function mk(theme, level, kind, html, extra) { return Object.assign({ theme, level, kind, html, text: htmlToText(html) }, extra); }
function finalize(q) {
  if (q.kind === 'qcm') q.answerHtml = q.options[q.correct];
  else if (q.kind === 'int') q.answerHtml = String(q.answer);
  else if (q.kind === 'val') q.answerHtml = q.show + (q.unit ? ' ' + q.unit : '');
  else q.answerHtml = fmt(q.exp, q.requireSci ? 'sci' : 'auto') + (q.unit ? ' ' + q.unit : '');
  q.answerText = htmlToText(q.answerHtml);
  return q;
}
/* QCM « tout fait » : finalize(qcm(theme, niveau, énoncé, bonneRéponse, [mauvaises], explication)) */
function qcm(theme, level, html, good, bad, expl) {
  const opts = shuffle([good].concat(bad));
  return finalize(mk(theme, level, 'qcm', html, { options: opts, correct: opts.indexOf(good), expl }));
}

root.NUM = { ri, pick, shuffle, MINUS, lastPow, value, supPow, fmtDec, fmtSci, decIsAmbiguous, needsSci, fmt, roundDigits, stripZeros, fromFloat, fromIntKeep, showInt, roundIntTo, parseNum, parseSigned, countCS, htmlToText, grade, randDigits, mk, finalize, qcm };
})(typeof window !== 'undefined' ? window : globalThis);
