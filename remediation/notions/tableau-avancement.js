/* =====================================================================
   NOTION : Tableau d'avancement (lycée : Seconde → Terminale)
   Équation et coefficients, quantité de matière initiale, état intermédiaire,
   avancement maximal et réactif limitant, état final, mélange stœchiométrique,
   avancement final et taux d'avancement (Terminale).
   ===================================================================== */
(function () {
'use strict';
const { ri, pick, shuffle, MINUS, fmt, roundDigits, fromFloat, lastPow, mk, finalize } = window.NUM;

const THEMES = {
  A: 'Équation de réaction et coefficients',
  B: 'Quantité de matière initiale',
  C: 'Remplir le tableau : état intermédiaire',
  D: 'Avancement maximal et réactif limitant',
  E: 'Composition de l\'état final',
  F: 'Mélange stœchiométrique',
  G: 'Avancement final et taux d\'avancement'
};
const RAPPELS = {
  A: 'Une équation conserve les éléments et les charges. Le coefficient devant une espèce indique dans quelle proportion (en mol) elle réagit ou se forme.',
  B: 'n = m / M (m en g) ; n = c × V (V en L) ; n = V<sub>gaz</sub> / V<sub>m</sub>. Toujours convertir avant de calculer.',
  C: 'Réactif de coefficient a : n<sub>i</sub> − a·x. Produit de coefficient b : n<sub>i</sub> + b·x (souvent b·x). Les réactifs diminuent, les produits augmentent.',
  D: 'Pour chaque réactif, on calcule n<sub>i</sub> / a. La plus petite valeur est x<sub>max</sub>, et ce réactif est limitant. On ne compare jamais directement les n<sub>i</sub>.',
  E: 'État final : on remplace x par x<sub>max</sub> dans chaque case. Le réactif limitant est à 0 ; aucune quantité n\'est négative.',
  F: 'Mélange stœchiométrique : n<sub>A</sub> / a = n<sub>B</sub> / b. Tous les réactifs sont épuisés en même temps.',
  G: 'τ = x<sub>f</sub> / x<sub>max</sub> (entre 0 et 1). τ = 1 : transformation totale ; τ &lt; 1 : non totale.'
};

/* ---------- écriture ---------- */
const nb = (x, dp) => (x < 0 ? MINUS : '') + Math.abs(x).toFixed(dp || 0).replace('.', ',');
function sig(x, n) { if (x === 0) return '0'; return (x < 0 ? MINUS : '') + fmt(roundDigits(fromFloat(x), n)); }
function sigTol(x, n) { if (x === 0) return 1e-9; return 0.5 * Math.pow(10, lastPow(roundDigits(fromFloat(x), n))) * 1.0001; }
const mol = x => sig(x, 3) + ' mol';
function qcm(theme, level, html, good, bad, expl) { const o = shuffle([good].concat(bad)); return finalize(mk(theme, level, 'qcm', html, { options: o, correct: o.indexOf(good), expl })); }
function qcmFixed(theme, level, html, options, correct, expl) { return finalize(mk(theme, level, 'qcm', html, { options, correct, expl })); }
function val(theme, level, html, v, show, unit, expl, o) {
  o = o || {};
  if (o.traps) { const tl = o.tol != null ? o.tol : 0.01 * Math.abs(v); o.traps = o.traps.filter(t => isFinite(t.val) && Math.abs(t.val - v) > tl && Math.abs(t.val + v) > tl); }
  return finalize(mk(theme, level, 'val', html, Object.assign({ val: v, show, unit, expl }, o)));
}
function intq(theme, level, html, answer, expl) { return finalize(mk(theme, level, 'int', html, { answer, expl })); }

/* ---------- réactions (espèce : [formule HTML, coefficient, masse molaire ou null, solvant ?]) ---------- */
const R = [
  { n: 'la combustion du méthane', r: [['CH<sub>4</sub>', 1, 16.0], ['O<sub>2</sub>', 2, 32.0]], p: [['CO<sub>2</sub>', 1, 44.0], ['H<sub>2</sub>O', 2, 18.0]] },
  { n: 'la synthèse de l\'eau', r: [['H<sub>2</sub>', 2, 2.0], ['O<sub>2</sub>', 1, 32.0]], p: [['H<sub>2</sub>O', 2, 18.0]] },
  { n: 'la combustion du propane', r: [['C<sub>3</sub>H<sub>8</sub>', 1, 44.0], ['O<sub>2</sub>', 5, 32.0]], p: [['CO<sub>2</sub>', 3, 44.0], ['H<sub>2</sub>O', 4, 18.0]] },
  { n: 'la combustion de l\'éthanol', r: [['C<sub>2</sub>H<sub>6</sub>O', 1, 46.0], ['O<sub>2</sub>', 3, 32.0]], p: [['CO<sub>2</sub>', 2, 44.0], ['H<sub>2</sub>O', 3, 18.0]] },
  { n: 'la combustion du magnésium', r: [['Mg', 2, 24.3], ['O<sub>2</sub>', 1, 32.0]], p: [['MgO', 2, 40.3]] },
  { n: 'l\'oxydation du fer', r: [['Fe', 4, 55.8], ['O<sub>2</sub>', 3, 32.0]], p: [['Fe<sub>2</sub>O<sub>3</sub>', 2, 159.6]] },
  { n: 'la synthèse de l\'ammoniac', r: [['N<sub>2</sub>', 1, 28.0], ['H<sub>2</sub>', 3, 2.0]], p: [['NH<sub>3</sub>', 2, 17.0]] },
  { n: 'l\'action d\'un acide sur l\'aluminium', r: [['Al', 2, 27.0], ['H<sup>+</sup>', 6, null]], p: [['Al<sup>3+</sup>', 2, null], ['H<sub>2</sub>', 3, 2.0]] },
  { n: 'l\'action d\'un acide sur le zinc', r: [['Zn', 1, 65.4], ['H<sup>+</sup>', 2, null]], p: [['Zn<sup>2+</sup>', 1, null], ['H<sub>2</sub>', 1, 2.0]] },
  { n: 'la précipitation de l\'hydroxyde de cuivre', r: [['Cu<sup>2+</sup>', 1, null], ['HO<sup>−</sup>', 2, null]], p: [['Cu(OH)<sub>2</sub>', 1, 97.6]] },
  { n: 'l\'action d\'un acide sur le calcaire', r: [['CaCO<sub>3</sub>', 1, 100.1], ['H<sup>+</sup>', 2, null]], p: [['Ca<sup>2+</sup>', 1, null], ['CO<sub>2</sub>', 1, 44.0], ['H<sub>2</sub>O', 1, 18.0, 1]] },
  { n: 'l\'oxydation des ions iodure', r: [['S<sub>2</sub>O<sub>8</sub><sup>2−</sup>', 1, null], ['I<sup>−</sup>', 2, null]], p: [['SO<sub>4</sub><sup>2−</sup>', 2, null], ['I<sub>2</sub>', 1, 253.8]] }
];
const co = c => (c === 1 ? '' : c + ' ');
function eq(re, blank) {
  // blank = [côté 'r'|'p', index] : coefficient remplacé par « … »
  const side = (arr, s) => arr.map((sp, i) => '<span style="white-space:nowrap">' + (blank && blank[0] === s && blank[1] === i ? '<b>…</b> ' : co(sp[1])) + sp[0] + '</span>').join(' + ');
  return '<div class="formula">' + side(re.r, 'r') + ' → ' + side(re.p, 'p') + '</div>';
}
const ax = (c, x) => (c === 1 ? x : c + x);   // « 2x », « x »
/* expression d'une case : réactif n0 − a·x, produit n0 + b·x */
function cell(n0, c, reac, x) {
  const t = ax(c, x || 'x');
  if (reac) return sig(n0, 3) + ' − ' + t;
  return n0 ? sig(n0, 3) + ' + ' + t : t;
}
/* tableau d'avancement HTML ; init = quantités initiales (mol) dans l'ordre réactifs puis produits */
function tableau(re, init, opts) {
  opts = opts || {};
  const sp = re.r.map(s => [s, 1]).concat(re.p.map(s => [s, 0]));
  const head = '<tr><th>État</th><th>Avancement</th>' + sp.map(([s]) => '<th>' + co(s[1]) + s[0] + '</th>').join('') + '</tr>';
  const row = (lab, x, f) => '<tr><td>' + lab + '</td><td>' + x + '</td>' + sp.map(([s, reac], i) => '<td>' + (s[3] ? 'solvant' : f(s, reac, i)) + '</td>').join('') + '</tr>';
  let rows = row('Initial', 'x = 0', (s, r, i) => opts.hideInit ? '' : sig(init[i], 3) || '0');
  rows += row('En cours', 'x', (s, r, i) => (opts.ask === i ? '<b>?</b>' : opts.hideMid ? '' : cell(init[i], s[1], r)));
  if (opts.final) rows += row('Final', 'x<sub>max</sub>', (s, r, i) => cell(init[i], s[1], r, 'x<sub>max</sub>'));
  return '<div class="scroll"><table class="tb av">' + head + rows + '</table></div><p class="muted" style="font-size:.85rem;margin-top:4px">Quantités de matière en mol.</p>';
}
/* quantités initiales de réactifs, avec rapports n/a bien distincts ; lim = indice du réactif limitant voulu */
function mixture(re, lim, opts) {
  opts = opts || {};
  for (let g = 0; g < 200; g++) {
    const xs = re.r.map(() => ri(20, 400) / 1000);
    const minI = xs.indexOf(Math.min(...xs));
    if (lim != null && minI !== lim) continue;
    const sorted = xs.slice().sort((a, b) => a - b);
    if (sorted[1] < sorted[0] * 1.2) continue;
    const ns = re.r.map((s, i) => +(xs[i] * s[1]).toPrecision(3));
    const ratios = ns.map((n, i) => n / re.r[i][1]);
    const li = ratios.indexOf(Math.min(...ratios));
    if (opts.trap) {   // le limitant n'est PAS le réactif en plus petite quantité
      const smallest = ns.indexOf(Math.min(...ns));
      if (smallest === li) continue;
    }
    return { ns, li, xmax: ratios[li] };
  }
  return opts.trap || lim != null ? mixture(re, null) : null;
}
const twoCoefs = () => pick(R.filter(re => re.r[0][1] !== re.r[1][1]));

/* ---------- A : équation ---------- */
function genA(level) {
  if (level === 1 || level === 2) {
    const pool = level === 1 ? R.filter(re => !re.r.concat(re.p).some(s => s[2] === null)) : R.filter(re => re.r.concat(re.p).some(s => s[2] === null));
    const re = pick(pool);
    const all = re.r.map((s, i) => ['r', i, s]).concat(re.p.map((s, i) => ['p', i, s])).filter(x => x[2][1] > 1);
    const [side, i, s] = pick(all);
    return intq('A', level, 'Complète l\'équation de ' + re.n + ' : quel coefficient faut-il écrire devant <b>' + s[0] + '</b> ?' + eq(re, [side, i]),
      s[1], 'Une équation conserve chaque <b>élément</b>' + (level === 2 ? ' et la <b>charge électrique</b>' : '') + ' : il faut le même nombre d\'atomes de chaque sorte de part et d\'autre de la flèche' + (level === 2 ? ', et la même charge totale' : '') + '. Le coefficient manquant est <b>' + s[1] + '</b>.' + eq(re));
  }
  const re = pick(R.filter(r => r.r[0][1] !== r.r[1][1]));
  const [A, B] = re.r;
  const k = B[1] / A[1];
  const good = 'Quand ' + A[1] + ' mol de ' + A[0] + ' réagi' + (A[1] > 1 ? 'ssent' : 't') + ', il réagit ' + B[1] + ' mol de ' + B[0];
  return qcm('A', 3, 'Que signifient les coefficients de l\'équation suivante ?' + eq(re),
    good, ['Il faut ' + B[1] + ' g de ' + B[0] + ' pour ' + A[1] + ' g de ' + A[0], 'Il faut introduire exactement ' + A[1] + ' mol de ' + A[0] + ' et ' + B[1] + ' mol de ' + B[0], 'La masse de ' + B[0] + ' qui réagit est ' + nb(k, k % 1 ? 1 : 0) + ' fois celle de ' + A[0]],
    'Les coefficients donnent des <b>proportions en quantité de matière</b> (en mol), pas en masse, et pas les quantités introduites : on peut introduire n\'importe quelles quantités, elles réagiront dans le rapport ' + A[1] + ' : ' + B[1] + '.');
}

/* ---------- B : quantité initiale ---------- */
const SOLIDES = [['le sulfate de cuivre CuSO<sub>4</sub>', 159.6], ['le chlorure de sodium NaCl', 58.5], ['le glucose C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>', 180.0], ['le fer Fe', 55.8], ['le zinc Zn', 65.4], ['le carbonate de calcium CaCO<sub>3</sub>', 100.1], ['le magnésium Mg', 24.3]];
function genB(level) {
  if (level === 1) {
    const [nom, M] = pick(SOLIDES), m = ri(100, 999) / 100 * pick([1, 10]), n = m / M;
    return val('B', 1, 'On pèse m = ' + sig(m, 3) + ' g de ' + nom + ' (M = ' + nb(M, 1) + ' g/mol). Calcule la quantité de matière n correspondante (3 chiffres significatifs).',
      n, sig(n, 3), 'mol', 'n = m / M = ' + sig(m, 3) + ' / ' + nb(M, 1) + ' ≈ <b>' + sig(n, 3) + ' mol</b>.',
      { tol: sigTol(n, 3), traps: [{ val: m * M, msg: 'On divise la masse par la masse molaire : n = m / M.' }, { val: M / m, msg: 'C\'est l\'inverse : n = m / M (masse divisée par masse molaire).' }], helper: 'Écris seulement le nombre, par exemple 2,35×10^-2.' });
  }
  if (level === 2) {
    const c = ri(10, 99) / 100 * pick([1, 0.1]), V = ri(10, 250), n = c * V / 1000;
    return val('B', 2, 'On prélève V = ' + V + ' mL d\'une solution de concentration en quantité de matière c = ' + sig(c, 2) + ' mol/L. Calcule la quantité de soluté prélevée n, en mol (3 chiffres significatifs).',
      n, sig(n, 3), 'mol', 'On convertit d\'abord : V = ' + V + ' mL = ' + sig(V / 1000, 3) + ' L. Puis n = c × V = ' + sig(c, 2) + ' × ' + sig(V / 1000, 3) + ' ≈ <b>' + sig(n, 3) + ' mol</b>.',
      { tol: sigTol(n, 3), traps: [{ val: c * V, msg: 'Le volume doit être en litres : ' + V + ' mL = ' + sig(V / 1000, 3) + ' L.' }, { val: c / (V / 1000), msg: 'On multiplie : n = c × V.' }, { val: c / V, msg: 'On multiplie : n = c × V, avec V en litres.' }], helper: 'Écris seulement le nombre, par exemple 2,35×10^-3.' });
  }
  if (Math.random() < 0.5) {
    const Vg = ri(20, 500), n = Vg / 1000 / 24.0;
    return val('B', 3, 'Une seringue contient V = ' + Vg + ' mL de dioxygène gazeux, à 20 °C (volume molaire V<sub>m</sub> = 24,0 L/mol). Calcule la quantité de dioxygène n (3 chiffres significatifs).',
      n, sig(n, 3), 'mol', 'V = ' + Vg + ' mL = ' + sig(Vg / 1000, 3) + ' L, puis n = V / V<sub>m</sub> = ' + sig(Vg / 1000, 3) + ' / 24,0 ≈ <b>' + sig(n, 3) + ' mol</b>.',
      { tol: sigTol(n, 3), traps: [{ val: Vg / 24, msg: 'Le volume doit être en litres, comme V<sub>m</sub> (L/mol).' }, { val: Vg / 1000 * 24, msg: 'On divise : n = V / V<sub>m</sub>.' }] });
  }
  const [nom, M] = pick(SOLIDES.slice(0, 3)), cm = ri(10, 200) / 10, V = ri(20, 250), n = cm * V / 1000 / M;
  return val('B', 3, 'Une solution de ' + nom.replace(/^le /, '') + ' a une concentration en masse c<sub>m</sub> = ' + sig(cm, 3) + ' g/L (M = ' + nb(M, 1) + ' g/mol). Calcule la quantité de soluté dans V = ' + V + ' mL de solution (3 chiffres significatifs).',
    n, sig(n, 3), 'mol', 'm = c<sub>m</sub> × V = ' + sig(cm, 3) + ' × ' + sig(V / 1000, 3) + ' = ' + sig(cm * V / 1000, 3) + ' g, puis n = m / M ≈ <b>' + sig(n, 3) + ' mol</b>. (Ou c = c<sub>m</sub> / M, puis n = c × V.)',
    { tol: sigTol(n, 3), traps: [{ val: cm * V / M, msg: 'Le volume doit être en litres.' }, { val: cm * V / 1000, msg: 'Ça, c\'est la masse de soluté en g : il faut encore diviser par M.' }, { val: cm / M, msg: 'Ça, c\'est la concentration en mol/L : multiplie par V (en L).' }] });
}

/* ---------- C : état intermédiaire ---------- */
function genC(level) {
  const re = twoCoefs();
  const m = mixture(re, null);
  const init = m.ns.concat(re.p.map(() => 0));
  if (level === 1) {
    const spIdx = re.r.concat(re.p).map((s, i) => [s, i]).filter(([s]) => !s[3] && s[1] > 1);
    const [s, i] = pick(spIdx);
    const reac = i < re.r.length, c = s[1];
    const good = cell(init[i], c, reac);
    const bad = reac ? [sig(init[i], 3) + ' − x', sig(init[i], 3) + ' + ' + ax(c, 'x'), ax(c, 'x')] : ['x', MINUS + ax(c, 'x'), sig(m.ns[0], 3) + ' − ' + ax(c, 'x')];
    return qcm('C', 1, 'Voici le tableau d\'avancement de ' + re.n + '. Quelle expression faut-il écrire dans la case marquée <b>?</b>' + eq(re) + tableau(re, init, { ask: i }),
      good, bad, reac ? 'Un <b>réactif</b> disparaît : on retire (coefficient × x). Ici le coefficient de ' + s[0] + ' est ' + c + ', donc n = <b>' + good + '</b>.' : 'Un <b>produit</b> se forme : il apparaît (coefficient × x). Ici le coefficient de ' + s[0] + ' est ' + c + ', donc n = <b>' + good + '</b>.');
  }
  if (level === 2) {
    const x = +(m.xmax * ri(20, 80) / 100).toPrecision(2);
    const opts = re.r.map((s, i) => [s, i, 1]).concat(re.p.map((s, i) => [s, re.r.length + i, 0])).filter(o => !o[0][3]);
    const [s, i, reac] = pick(opts), c = s[1];
    const v = reac ? init[i] - c * x : c * x;
    return val('C', 2, 'Pour ' + re.n + ', on part de ' + re.r.map((sp, j) => sig(m.ns[j], 3) + ' mol de ' + sp[0]).join(' et ') + ' (pas de produit au départ).' + eq(re) + 'Calcule la quantité de <b>' + s[0] + '</b> quand l\'avancement vaut x = ' + sig(x, 2) + ' mol (3 chiffres significatifs).',
      v, sig(v, 3), 'mol', (reac ? 'Réactif : n = n<sub>i</sub> − ' + ax(c, 'x') + ' = ' + sig(init[i], 3) + ' − ' + (c > 1 ? c + ' × ' : '') + sig(x, 2) : 'Produit : n = ' + ax(c, 'x') + ' = ' + (c > 1 ? c + ' × ' : '') + sig(x, 2)) + ' = <b>' + sig(v, 3) + ' mol</b>.',
      { tol: sigTol(v, 3), traps: reac ? [{ val: init[i] - x, msg: 'Il faut multiplier x par le coefficient de ' + s[0] + ' (' + c + ').' }, { val: init[i] + c * x, msg: 'Un réactif disparaît : on <b>retire</b> ' + ax(c, 'x') + '.' }, { val: c * x, msg: 'Ça, c\'est la quantité qui a réagi : il faut la retirer de la quantité initiale.' }] : [{ val: x, msg: 'Il faut multiplier x par le coefficient de ' + s[0] + ' (' + c + ').' }] });
  }
  const i = pick([0, 1]), s = re.r[i], c = s[1];
  const x = +(m.xmax * ri(20, 80) / 100).toPrecision(2), rest = init[i] - c * x;
  return val('C', 3, 'Pour ' + re.n + ', la quantité initiale de ' + s[0] + ' est ' + sig(init[i], 3) + ' mol.' + eq(re) + 'À un instant t, il en reste ' + sig(rest, 3) + ' mol. Que vaut l\'avancement x à cet instant (3 chiffres significatifs) ?',
    (init[i] - rest) / c, sig((init[i] - rest) / c, 3), 'mol', 'n(' + s[0] + ') = n<sub>i</sub> − ' + ax(c, 'x') + ', donc x = (n<sub>i</sub> − n) / ' + c + ' = (' + sig(init[i], 3) + ' − ' + sig(rest, 3) + ') / ' + c + ' ≈ <b>' + sig((init[i] - rest) / c, 3) + ' mol</b>.',
    { tol: sigTol((init[i] - rest) / c, 3), traps: [{ val: init[i] - rest, msg: 'Ça, c\'est la quantité de ' + s[0] + ' qui a réagi, soit ' + ax(c, 'x') + ' : il faut encore diviser par ' + c + '.' }, { val: rest, msg: 'Ça, c\'est la quantité restante, pas l\'avancement.' }, { val: (init[i] - rest) * c, msg: 'On divise par le coefficient : x = (n<sub>i</sub> − n) / ' + c + '.' }] });
}

/* ---------- D : avancement maximal, réactif limitant ---------- */
function genD(level) {
  const re = twoCoefs(), [A, B] = re.r;
  const m = mixture(re, null, { trap: Math.random() < 0.7 });
  const data = 'On mélange ' + sig(m.ns[0], 3) + ' mol de ' + A[0] + ' et ' + sig(m.ns[1], 3) + ' mol de ' + B[0] + '.' + eq(re);
  const why = 'On compare n/coefficient : ' + A[0] + ' : ' + sig(m.ns[0], 3) + ' / ' + A[1] + ' = ' + sig(m.ns[0] / A[1], 3) + ' mol ; ' + B[0] + ' : ' + sig(m.ns[1], 3) + ' / ' + B[1] + ' = ' + sig(m.ns[1] / B[1], 3) + ' mol. La plus petite valeur donne x<sub>max</sub> = ' + sig(m.xmax, 3) + ' mol et le réactif limitant : <b>' + re.r[m.li][0] + '</b>.';
  if (level === 1) {
    const smallest = m.ns[0] < m.ns[1] ? 0 : 1;
    return qcmFixed('D', 1, data + 'Quel est le réactif limitant ?', [A[0], B[0], 'Aucun : le mélange est stœchiométrique'], m.li,
      why + (smallest !== m.li ? ' Attention : ce n\'est <b>pas</b> le réactif introduit en plus petite quantité, à cause des coefficients.' : ''));
  }
  if (level === 2) {
    return val('D', 2, data + 'Calcule l\'avancement maximal x<sub>max</sub> (3 chiffres significatifs).',
      m.xmax, sig(m.xmax, 3), 'mol', why,
      { tol: sigTol(m.xmax, 3), traps: [{ val: Math.min(...m.ns), msg: 'Tu as pris la plus petite quantité initiale sans tenir compte des coefficients : on compare n<sub>i</sub> / a.' }, { val: Math.max(m.ns[0] / A[1], m.ns[1] / B[1]), msg: 'x<sub>max</sub> est la <b>plus petite</b> des valeurs n<sub>i</sub> / a : au-delà, un réactif aurait une quantité négative.' }, { val: m.ns[m.li] * re.r[m.li][1], msg: 'On divise par le coefficient : x<sub>max</sub> = n<sub>i</sub> / a.' }] });
  }
  const re2 = pick(R.filter(r => r.r.every(s => s[2]) && r.r[0][1] !== r.r[1][1]));
  const m2 = mixture(re2, null, { trap: Math.random() < 0.6 });
  const masses = m2.ns.map((n, i) => n * re2.r[i][2]);
  const ms = masses.map(mm => sig(mm, 3));
  const nsR = ms.map((s, i) => parseFloat(s.replace(',', '.')) / re2.r[i][2]);
  const ratios = nsR.map((n, i) => n / re2.r[i][1]), li = ratios.indexOf(Math.min(...ratios)), xmax = ratios[li];
  return val('D', 3, 'On fait réagir m = ' + ms[0] + ' g de ' + re2.r[0][0] + ' (M = ' + nb(re2.r[0][2], 1) + ' g/mol) avec m = ' + ms[1] + ' g de ' + re2.r[1][0] + ' (M = ' + nb(re2.r[1][2], 1) + ' g/mol).' + eq(re2) + 'Calcule l\'avancement maximal x<sub>max</sub> (3 chiffres significatifs).',
    xmax, sig(xmax, 3), 'mol', 'On passe en mol : ' + re2.r.map((s, i) => 'n(' + s[0] + ') = ' + ms[i] + ' / ' + nb(s[2], 1) + ' = ' + sig(nsR[i], 3) + ' mol').join(' ; ') + '. Puis n/a : ' + re2.r.map((s, i) => sig(ratios[i], 3)).join(' et ') + ' mol. x<sub>max</sub> = <b>' + sig(xmax, 3) + ' mol</b>, réactif limitant ' + re2.r[li][0] + '.',
    { tol: sigTol(xmax, 3), traps: [{ val: Math.min(...nsR), msg: 'Tu as oublié de diviser par les coefficients : x<sub>max</sub> = min(n<sub>i</sub> / a).' }, { val: Math.min(...masses.map(x => +x)), msg: 'Il faut d\'abord convertir les masses en quantités de matière (n = m / M).' }, { val: Math.min(...ms.map((s, i) => parseFloat(s.replace(',', '.')) / re2.r[i][1])), msg: 'Il faut convertir les masses en mol (n = m / M) avant de diviser par les coefficients.' }] });
}

/* ---------- E : état final ---------- */
function genE(level) {
  const re = twoCoefs();
  const m = mixture(re, null);
  const exI = 1 - m.li, Ex = re.r[exI];
  const data = 'On mélange ' + re.r.map((s, j) => sig(m.ns[j], 3) + ' mol de ' + s[0]).join(' et ') + '. La transformation est totale.' + eq(re);
  if (level === 1) {
    const prods = re.p.filter(s => !s[3]), P = pick(prods), v = P[1] * m.xmax;
    return val('E', 1, data + 'On a trouvé x<sub>max</sub> = ' + sig(m.xmax, 3) + ' mol. Quelle quantité de <b>' + P[0] + '</b> obtient-on à l\'état final (3 chiffres significatifs) ?',
      v, sig(v, 3), 'mol', 'Produit : n<sub>f</sub> = ' + ax(P[1], 'x<sub>max</sub>') + ' = ' + (P[1] > 1 ? P[1] + ' × ' : '') + sig(m.xmax, 3) + ' = <b>' + sig(v, 3) + ' mol</b>.',
      { tol: sigTol(v, 3), traps: [{ val: m.xmax, msg: 'Il faut multiplier x<sub>max</sub> par le coefficient de ' + P[0] + ' (' + P[1] + ').' }, { val: m.xmax / P[1], msg: 'Pour un produit, on <b>multiplie</b> par le coefficient : ' + ax(P[1], 'x<sub>max</sub>') + '.' }] });
  }
  if (level === 2) {
    const v = m.ns[exI] - Ex[1] * m.xmax;
    return val('E', 2, data + 'Le réactif limitant est ' + re.r[m.li][0] + ' et x<sub>max</sub> = ' + sig(m.xmax, 3) + ' mol. Quelle quantité de <b>' + Ex[0] + '</b> (en excès) reste-t-il à l\'état final (3 chiffres significatifs) ?',
      v, sig(v, 3), 'mol', 'n<sub>f</sub>(' + Ex[0] + ') = n<sub>i</sub> − ' + ax(Ex[1], 'x<sub>max</sub>') + ' = ' + sig(m.ns[exI], 3) + ' − ' + (Ex[1] > 1 ? Ex[1] + ' × ' : '') + sig(m.xmax, 3) + ' = <b>' + sig(v, 3) + ' mol</b>.',
      { tol: sigTol(v, 3), traps: [{ val: m.ns[exI] - m.xmax, msg: 'Il faut multiplier x<sub>max</sub> par le coefficient de ' + Ex[0] + ' (' + Ex[1] + ').' }, { val: 0, msg: 'Seul le réactif <b>limitant</b> est entièrement consommé ; ' + Ex[0] + ' est en excès, il en reste.' }, { val: m.ns[exI] - m.ns[m.li], msg: 'On ne soustrait pas les quantités initiales : n<sub>f</sub> = n<sub>i</sub> − ' + ax(Ex[1], 'x<sub>max</sub>') + '.' }], signMsg: 'Une quantité de matière ne peut pas être négative : vérifie x<sub>max</sub> et le coefficient.' });
  }
  const re3 = pick(R.filter(r => r.p.some(s => s[2] && !s[3]) && r.r[0][1] !== r.r[1][1]));
  const m3 = mixture(re3, null), P = re3.p.filter(s => s[2] && !s[3])[0], mass = P[1] * m3.xmax * P[2];
  return val('E', 3, 'On mélange ' + re3.r.map((s, j) => sig(m3.ns[j], 3) + ' mol de ' + s[0]).join(' et ') + ' (transformation totale).' + eq(re3) + 'Calcule la <b>masse</b> de ' + P[0] + ' obtenue (M = ' + nb(P[2], 1) + ' g/mol, 3 chiffres significatifs).',
    mass, sig(mass, 3), 'g', 'x<sub>max</sub> = min(' + re3.r.map((s, i) => sig(m3.ns[i] / s[1], 3)).join(' ; ') + ') = ' + sig(m3.xmax, 3) + ' mol. n(' + P[0] + ') = ' + ax(P[1], 'x<sub>max</sub>') + ' = ' + sig(P[1] * m3.xmax, 3) + ' mol, puis m = n × M ≈ <b>' + sig(mass, 3) + ' g</b>.',
    { tol: sigTol(mass, 3), traps: [{ val: m3.xmax * P[2], msg: 'n(' + P[0] + ') = ' + ax(P[1], 'x<sub>max</sub>') + ' : tu as oublié le coefficient ' + P[1] + '.' }, { val: P[1] * Math.min(...m3.ns) * P[2], msg: 'Le réactif limitant se trouve avec n<sub>i</sub> / a, pas avec la plus petite quantité.' }, { val: P[1] * m3.xmax, msg: 'Ça, c\'est la quantité en mol : multiplie par M pour avoir la masse.' }] });
}

/* ---------- F : mélange stœchiométrique ---------- */
function genF(level) {
  const re = twoCoefs(), [A, B] = re.r;
  if (level === 1) {
    return qcm('F', 1, 'Pour la réaction ' + eq(re).replace(/<\/?div[^>]*>/g, '') + ', le mélange initial est <b>stœchiométrique</b> si :',
      'n(' + A[0] + ') / ' + A[1] + ' = n(' + B[0] + ') / ' + B[1], ['n(' + A[0] + ') = n(' + B[0] + ')', A[1] + ' × n(' + A[0] + ') = ' + B[1] + ' × n(' + B[0] + ')', 'm(' + A[0] + ') = m(' + B[0] + ')'],
      'Stœchiométrique : les réactifs sont introduits dans les proportions de l\'équation, donc ils sont <b>épuisés en même temps</b> : n<sub>A</sub>/a = n<sub>B</sub>/b = x<sub>max</sub>.');
  }
  const nA = ri(100, 900) / 1000 * pick([1, 0.1]), nB = nA * B[1] / A[1];
  if (level === 2) {
    return val('F', 2, 'Pour ' + re.n + ', on dispose de ' + sig(nA, 3) + ' mol de ' + A[0] + '.' + eq(re) + 'Quelle quantité de ' + B[0] + ' faut-il introduire pour que le mélange soit stœchiométrique (3 chiffres significatifs) ?',
      nB, sig(nB, 3), 'mol', 'n(' + B[0] + ') / ' + B[1] + ' = n(' + A[0] + ') / ' + A[1] + ', donc n(' + B[0] + ') = ' + B[1] + '/' + A[1] + ' × ' + sig(nA, 3) + ' = <b>' + sig(nB, 3) + ' mol</b>.',
      { tol: sigTol(nB, 3), traps: [{ val: nA, msg: 'Les quantités ne sont pas égales : elles sont dans le rapport des coefficients ' + A[1] + ' : ' + B[1] + '.' }, { val: nA * A[1] / B[1], msg: 'Rapport inversé : n(' + B[0] + ') = (' + B[1] + '/' + A[1] + ') × n(' + A[0] + ').' }] });
  }
  const re2 = pick(R.filter(r => r.r.every(s => s[2]) && r.r[0][1] !== r.r[1][1])), [A2, B2] = re2.r;
  const mA = ri(100, 999) / 100, n2 = mA / A2[2] * B2[1] / A2[1], mB = n2 * B2[2];
  return val('F', 3, 'Pour ' + re2.n + ', on utilise m = ' + sig(mA, 3) + ' g de ' + A2[0] + ' (M = ' + nb(A2[2], 1) + ' g/mol).' + eq(re2) + 'Quelle <b>masse</b> de ' + B2[0] + ' (M = ' + nb(B2[2], 1) + ' g/mol) faut-il pour un mélange stœchiométrique (3 chiffres significatifs) ?',
    mB, sig(mB, 3), 'g', 'n(' + A2[0] + ') = ' + sig(mA, 3) + ' / ' + nb(A2[2], 1) + ' = ' + sig(mA / A2[2], 3) + ' mol ; n(' + B2[0] + ') = ' + B2[1] + '/' + A2[1] + ' × n(' + A2[0] + ') = ' + sig(n2, 3) + ' mol ; m = n × M ≈ <b>' + sig(mB, 3) + ' g</b>.',
    { tol: sigTol(mB, 3), traps: [{ val: mA, msg: 'Les masses ne sont pas égales : on raisonne en quantités de matière.' }, { val: mA * B2[1] / A2[1], msg: 'Le rapport des coefficients s\'applique aux quantités de matière (mol), pas aux masses.' }, { val: mA / A2[2] * B2[2], msg: 'Tu as oublié le rapport des coefficients ' + A2[1] + ' : ' + B2[1] + '.' }, { val: n2, msg: 'Ça, c\'est la quantité en mol : multiplie par M.' }] });
}

/* ---------- G : avancement final, taux d'avancement ---------- */
function genG(level) {
  if (level === 1) {
    return pick([
      () => qcm('G', 1, 'Une transformation est dite <b>totale</b> lorsque :',
        'l\'avancement final est égal à l\'avancement maximal (x<sub>f</sub> = x<sub>max</sub>)', ['l\'avancement final est nul', 'tous les réactifs sont en excès', 'l\'avancement final est supérieur à l\'avancement maximal'],
        'Totale : la transformation s\'arrête parce qu\'un réactif est épuisé, donc x<sub>f</sub> = x<sub>max</sub> et τ = 1. Sinon (x<sub>f</sub> &lt; x<sub>max</sub>), elle est non totale : c\'est le cas des réactions acide-base avec un acide faible, des estérifications…'),
      () => qcm('G', 1, 'Que peut-on dire du taux d\'avancement final τ = x<sub>f</sub> / x<sub>max</sub> ?',
        'C\'est un nombre compris entre 0 et 1', ['Il peut dépasser 1 si on met un réactif en excès', 'Il s\'exprime en mol', 'Il vaut toujours 1'],
        'x<sub>f</sub> ne peut pas dépasser x<sub>max</sub> : 0 ≤ τ ≤ 1. C\'est un quotient de deux quantités en mol, donc <b>sans unité</b> (on l\'exprime parfois en %).')
    ])();
  }
  if (level === 2) {
    const xmax = ri(100, 900) / 1000 * pick([1, 0.01]), tau = ri(5, 95) / 100, xf = +(xmax * tau).toPrecision(3), t = xf / xmax;
    return val('G', 2, 'Pour une transformation, l\'avancement maximal vaut x<sub>max</sub> = ' + sig(xmax, 3) + ' mol et l\'avancement final mesuré x<sub>f</sub> = ' + sig(xf, 3) + ' mol. Calcule le taux d\'avancement final τ (nombre décimal, 2 chiffres significatifs).',
      t, sig(t, 2), '', 'τ = x<sub>f</sub> / x<sub>max</sub> = ' + sig(xf, 3) + ' / ' + sig(xmax, 3) + ' ≈ <b>' + sig(t, 2) + '</b> (soit ' + Math.round(t * 100) + ' %). τ &lt; 1 : la transformation n\'est pas totale.',
      { tol: sigTol(t, 2), traps: [{ val: 1 / t, msg: 'C\'est l\'inverse : τ = x<sub>f</sub> / x<sub>max</sub>, toujours inférieur ou égal à 1.' }, { val: t * 100, msg: 'Donne τ sous forme décimale (par exemple 0,35), sans le facteur 100.' }], helper: 'Écris un nombre décimal entre 0 et 1, par exemple 0,35.' });
  }
  const c = ri(10, 100) / 1000, pH = Math.round(50 * (4.76 - Math.log10(c))) / 100, h = Math.pow(10, -pH), t = h / c, V = ri(5, 20) * 10;
  return val('G', 3, 'On dissout de l\'acide éthanoïque dans l\'eau : CH<sub>3</sub>COOH + H<sub>2</sub>O → CH<sub>3</sub>COO<sup>−</sup> + H<sub>3</sub>O<sup>+</sup>. Concentration apportée c = ' + sig(c, 2) + ' mol/L, volume V = ' + V + ' mL, pH mesuré : ' + nb(pH, 2) + '. Calcule le taux d\'avancement final τ (2 chiffres significatifs).',
    t, sig(t, 2), '', 'x<sub>max</sub> = c × V (l\'acide est limitant, l\'eau est le solvant). x<sub>f</sub> = [H<sub>3</sub>O<sup>+</sup>]<sub>f</sub> × V avec [H<sub>3</sub>O<sup>+</sup>] = 10<sup>−pH</sup> = ' + sig(h, 2) + ' mol/L. Donc τ = 10<sup>−pH</sup> / c ≈ <b>' + sig(t, 2) + '</b> : la transformation est très peu avancée (non totale). Le volume se simplifie.',
    { tol: sigTol(t, 2), traps: [{ val: c / h, msg: 'C\'est l\'inverse : τ = x<sub>f</sub> / x<sub>max</sub> = [H<sub>3</sub>O<sup>+</sup>] / c.' }, { val: t * 100, msg: 'Donne τ sous forme décimale, sans le facteur 100.' }, { val: pH * c, msg: '[H<sub>3</sub>O<sup>+</sup>] = 10<sup>−pH</sup>, pas pH.' }, { val: h * V / 1000, msg: 'Ça, c\'est x<sub>f</sub> en mol : divise par x<sub>max</sub> = c × V.' }], helper: 'Écris un nombre décimal, par exemple 1,3×10^-2 ou 0,013.' });
}

/* ---------- fiches ---------- */
const EX = R[0];
const FICHES = {
A: `
<h3>De quoi parle-t-on ?</h3>
<p>Une transformation chimique est modélisée par une <b>réaction</b>, représentée par une <b>équation</b> : réactifs à gauche, produits à droite. Les nombres placés devant les formules sont les <b>coefficients stœchiométriques</b>.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Les coefficients disent dans quelles proportions les espèces réagissent et se forment. Toute la suite (tableau, réactif limitant, quantités finales) en dépend.</p>
<h3>Règles d'application</h3>
<ul>
<li>Une équation conserve chaque <b>élément</b> (même nombre d'atomes de chaque sorte à gauche et à droite) et la <b>charge électrique</b>.</li>
<li>On ajuste uniquement les coefficients, jamais les indices des formules.</li>
<li>Le coefficient 1 ne s'écrit pas.</li>
<li>Les coefficients sont des proportions en <b>quantité de matière</b> (mol), pas en masse, et pas les quantités introduites.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">CH<sub>4</sub> + 2 O<sub>2</sub> → CO<sub>2</sub> + 2 H<sub>2</sub>O : quand 1 mol de méthane réagit, 2 mol de dioxygène réagissent ; il se forme 1 mol de CO<sub>2</sub> et 2 mol d'eau. Vérification : C : 1 = 1 ; H : 4 = 2 × 2 ; O : 2 × 2 = 2 + 2.</div>`,
B: `
<h3>De quoi parle-t-on ?</h3>
<p>Un tableau d'avancement se remplit en <b>moles</b>. Il faut donc d'abord convertir les données (masse, volume de solution, volume de gaz) en <b>quantités de matière</b>.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Les coefficients de l'équation ne s'appliquent qu'aux quantités de matière. Une erreur de conversion fausse tout le tableau.</p>
<h3>Règles d'application</h3>
<div class="rule">n = m / M &nbsp;(m en g, M en g/mol) &nbsp;;&nbsp; n = c × V &nbsp;(V en L) &nbsp;;&nbsp; n = V<sub>gaz</sub> / V<sub>m</sub> &nbsp;(V en L)</div>
<ul>
<li>Convertir les volumes en <b>litres</b> : 25,0 mL = 25,0×10<sup>−3</sup> L.</li>
<li>Concentration en masse c<sub>m</sub> (g/L) → concentration en quantité de matière : c = c<sub>m</sub> / M.</li>
<li>V<sub>m</sub> ≈ 24,0 L/mol à 20 °C sous la pression atmosphérique (22,4 L/mol à 0 °C).</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">25,0 mL de solution à c = 0,200 mol/L : n = 0,200 × 25,0×10<sup>−3</sup> = <b>5,00×10<sup>−3</sup> mol</b>.</div>`,
C: `
<h3>De quoi parle-t-on ?</h3>
<p>L'<b>avancement</b> x (en mol) décrit où en est la transformation. Dans le tableau, chaque colonne suit une espèce ; chaque ligne est un état du système.</p>
${tableau(EX, [0.300, 0.500, 0, 0])}
<h3>Pourquoi est-ce important ?</h3>
<p>Le tableau permet de connaître la composition du système à n'importe quel moment, et de trouver l'état final.</p>
<h3>Règles d'application</h3>
<ul>
<li><b>Réactif</b> de coefficient a : n = n<sub>i</sub> <b>− a·x</b> (il disparaît).</li>
<li><b>Produit</b> de coefficient b : n = n<sub>i</sub> <b>+ b·x</b> (souvent n<sub>i</sub> = 0, donc b·x).</li>
<li>Le coefficient multiplie <b>x</b> : on ne l'oublie jamais.</li>
<li>Un solvant (l'eau, en solution aqueuse) est en large excès : on écrit « solvant » ou « excès ».</li>
<li>Pour retrouver x à partir d'une quantité mesurée : x = (n<sub>i</sub> − n) / a.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Avec 0,500 mol de O<sub>2</sub> au départ, quand x = 0,100 mol : n(O<sub>2</sub>) = 0,500 − 2 × 0,100 = <b>0,300 mol</b> et n(H<sub>2</sub>O) = 2 × 0,100 = <b>0,200 mol</b>.</div>`,
D: `
<h3>De quoi parle-t-on ?</h3>
<p>Si la transformation est totale, elle s'arrête quand un réactif est épuisé : c'est le <b>réactif limitant</b>. L'avancement atteint alors sa valeur <b>maximale</b> x<sub>max</sub>.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>x<sub>max</sub> fixe toutes les quantités finales : combien de produit on obtient, combien de réactif il reste.</p>
<h3>Règles d'application</h3>
<div class="rule">Pour chaque réactif : n<sub>i</sub> − a·x<sub>max</sub> = 0, soit x = n<sub>i</sub> / a. x<sub>max</sub> est la <b>plus petite</b> de ces valeurs ; le réactif correspondant est limitant.</div>
<ul>
<li><b>Erreur n°1 :</b> choisir le réactif introduit en plus petite quantité. Le limitant n'est <b>pas forcément</b> celui-là : il faut diviser par les coefficients.</li>
<li>On prend la plus petite valeur : avec une plus grande, l'autre réactif aurait une quantité négative.</li>
<li>Si toutes les valeurs n<sub>i</sub>/a sont égales, le mélange est stœchiométrique.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">CH<sub>4</sub> + 2 O<sub>2</sub> → … avec 0,300 mol de CH<sub>4</sub> et 0,500 mol de O<sub>2</sub>. CH<sub>4</sub> : 0,300 / 1 = 0,300 ; O<sub>2</sub> : 0,500 / 2 = 0,250. x<sub>max</sub> = <b>0,250 mol</b> ; le réactif limitant est <b>O<sub>2</sub></b>, alors qu'on en a mis davantage !</div>`,
E: `
<h3>De quoi parle-t-on ?</h3>
<p>L'<b>état final</b> est la dernière ligne du tableau : on remplace x par x<sub>max</sub> (ou par x<sub>f</sub> si la transformation n'est pas totale).</p>
<h3>Pourquoi est-ce important ?</h3>
<p>C'est ce qu'on demande presque toujours : quelle masse de produit obtient-on ? reste-t-il du réactif ? quelle est la composition finale ?</p>
<h3>Règles d'application</h3>
<ul>
<li>Réactif limitant : n<sub>f</sub> = 0.</li>
<li>Réactif en excès : n<sub>f</sub> = n<sub>i</sub> − a·x<sub>max</sub> &gt; 0.</li>
<li>Produit : n<sub>f</sub> = n<sub>i</sub> + b·x<sub>max</sub>.</li>
<li>Une quantité finale <b>négative</b> signale une erreur (mauvais x<sub>max</sub> ou coefficient oublié).</li>
<li>Pour une masse : m = n × M.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Suite de l'exemple (x<sub>max</sub> = 0,250 mol) : CH<sub>4</sub> : 0,300 − 0,250 = 0,050 mol ; O<sub>2</sub> : 0 ; CO<sub>2</sub> : 0,250 mol ; H<sub>2</sub>O : 2 × 0,250 = 0,500 mol, soit m = 0,500 × 18,0 = <b>9,00 g</b> d'eau.</div>`,
F: `
<h3>De quoi parle-t-on ?</h3>
<p>Un mélange est <b>stœchiométrique</b> quand les réactifs sont introduits exactement dans les proportions de l'équation : ils sont tous épuisés en même temps.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>C'est la situation à l'<b>équivalence</b> d'un titrage, et la façon de ne rien gaspiller dans une synthèse.</p>
<h3>Règles d'application</h3>
<div class="rule">Pour a A + b B → … : mélange stœchiométrique ⇔ n<sub>A</sub> / a = n<sub>B</sub> / b</div>
<ul>
<li>Quantité de B nécessaire : n<sub>B</sub> = (b / a) × n<sub>A</sub>.</li>
<li>Le rapport des coefficients s'applique aux <b>moles</b>, pas aux masses : passer par n = m / M.</li>
<li>Titrage : à l'équivalence, n(titré) / a = n(titrant versé) / b.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">2 Mg + O<sub>2</sub> → 2 MgO avec 0,40 mol de Mg : il faut n(O<sub>2</sub>) = (1/2) × 0,40 = <b>0,20 mol</b> de dioxygène.</div>`,
G: `
<h3>De quoi parle-t-on ?</h3>
<p>Certaines transformations s'arrêtent <b>avant</b> l'épuisement du réactif limitant : l'avancement final x<sub>f</sub> (mesuré) est inférieur à x<sub>max</sub> (calculé). <span class="muted">(Terminale)</span></p>
<h3>Pourquoi est-ce important ?</h3>
<p>C'est le cas des acides faibles, des estérifications, de nombreux équilibres chimiques. Le taux d'avancement indique à quel point la transformation est avancée.</p>
<h3>Règles d'application</h3>
<div class="rule">τ = x<sub>f</sub> / x<sub>max</sub>, nombre sans unité compris entre 0 et 1.</div>
<ul>
<li>τ = 1 : transformation <b>totale</b> ; τ &lt; 1 : transformation <b>non totale</b>.</li>
<li>x<sub>max</sub> se calcule (tableau d'avancement) ; x<sub>f</sub> se <b>mesure</b> (pH, conductimétrie, spectrophotométrie…).</li>
<li>Acide HA dans l'eau : x<sub>f</sub> = [H<sub>3</sub>O<sup>+</sup>]<sub>f</sub> × V avec [H<sub>3</sub>O<sup>+</sup>] = 10<sup>−pH</sup>, x<sub>max</sub> = c × V, donc τ = 10<sup>−pH</sup> / c.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Acide éthanoïque, c = 1,0×10<sup>−2</sup> mol/L, pH = 3,4 : τ = 10<sup>−3,4</sup> / 1,0×10<sup>−2</sup> ≈ <b>0,040</b> : seulement 4 % des molécules d'acide ont réagi.</div>`
};

(window.RPC_NOTIONS = window.RPC_NOTIONS || {})['tableau-avancement'] = {
  titre: 'Tableau d\'avancement',
  niveau: 'Seconde → Terminale',
  themes: THEMES,
  rappels: RAPPELS,
  fiches: FICHES,
  gen: { A: genA, B: genB, C: genC, D: genD, E: genE, F: genF, G: genG },
  testLevels: { A: [1, 3], B: [1, 2], C: [1, 2], D: [1, 2], E: [1, 2], F: [1, 2], G: [1, 2] },
  aide: 'Les quantités de matière s\'écrivent en mol, sans l\'unité dans la réponse. Pour une puissance de 10, tape par exemple <b>2,50×10^-3</b> ou <b>2,50e-3</b>. Le dernier point (taux d\'avancement) relève de la Terminale.'
};
})();
