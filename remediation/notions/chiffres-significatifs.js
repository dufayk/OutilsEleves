/* =====================================================================
   NOTION : Chiffres significatifs (Terminale – spécialité physique-chimie)
   Modèle à copier pour créer une nouvelle notion. Une notion déclare :
     titre, niveau, themes {clé: nom}, rappels {clé: rappel court},
     fiches {clé: HTML de la fiche de cours}, gen {clé: function(niveau 1..3) -> question},
     testLevels {clé: [niveaux posés au diagnostic et au test final]},
     aide (facultatif) : conseil de saisie affiché avant le diagnostic.
   Les questions se fabriquent avec NUM.mk(...) puis NUM.finalize(...) (voir assets/num.js).
   ===================================================================== */
(function () {
'use strict';
const { ri, pick, shuffle, MINUS, value, supPow, fmtDec, fmtSci, decIsAmbiguous, needsSci, fmt, roundDigits, stripZeros, fromFloat, fromIntKeep, showInt, roundIntTo, randDigits, mk, finalize } = window.NUM;

const THEMES = {
  A: 'Compter les chiffres significatifs',
  B: 'Notation scientifique',
  C: 'Arrondir un résultat',
  D: 'Multiplication et division',
  E: 'Addition et soustraction',
  F: 'Résultat final et incertitude'
};
const RAPPELS = {
  A: 'On compte tous les chiffres à partir du premier chiffre non nul. Les zéros de gauche ne comptent pas ; les zéros situés au milieu, et ceux à la fin après la virgule, comptent.',
  B: 'Notation scientifique : a×10<sup>n</sup> avec 1 ≤ a &lt; 10. La mantisse a garde tous les chiffres significatifs, y compris les zéros finaux. Changer d\'unité ne change pas le nombre de CS.',
  C: 'On garde n chiffres à partir du premier chiffre non nul. Si le chiffre suivant est 5 ou plus, on augmente le dernier chiffre gardé de 1 ; sinon on le laisse.',
  D: 'Multiplication et division : le résultat garde autant de CS que la donnée qui en a le moins.',
  E: 'Addition et soustraction : on met tout dans la même unité ; le résultat garde autant de décimales que la donnée qui en a le moins.',
  F: 'L\'incertitude-type s\'écrit avec 1 seul CS, arrondie par excès ; on arrondit la valeur au même rang que le dernier chiffre de l\'incertitude. On n\'arrondit qu\'à la fin du calcul.'
};

const CTX_A = [['m', 'g'], ['V', 'mL'], ['L', 'cm'], ['t', 's'], ['c', 'mol/L'], ['d', 'm'], ['U', 'V'], ['I', 'A']];

function genA(level) {
  const [sym, unit] = pick(CTX_A);
  let d, show, sci = false;
  if (level === 1) {
    const n = ri(2, 4);
    d = { digits: randDigits(n, { innerZero: false }), power: ri(0, Math.min(2, n - 1)) };
  } else if (level === 2) {
    const n = ri(2, 4);
    const variant = n >= 3 ? pick(['lead', 'inner', 'both']) : 'lead';
    const digits = randDigits(n, { innerZero: false, forceInnerZero: variant !== 'lead' });
    d = { digits, power: variant === 'inner' ? ri(0, 1) : -ri(1, 3) };
  } else {
    const n = ri(3, 5);
    const digits = randDigits(n, { trailingZero: true });
    const variant = pick(['dec', 'sci', 'lead']);
    if (variant === 'sci') { d = { digits, power: pick([-6, -5, -4, -3, 3, 4, 5, 6, 7]) }; sci = true; }
    else if (variant === 'lead') d = { digits, power: -ri(1, 3) };
    else d = { digits, power: ri(0, n - 2) };
  }
  show = sci ? fmtSci(d) : fmtDec(d);
  const notes = [];
  const lastNz = d.digits.replace(/0+$/, '').length;
  if (!sci && d.power < 0) notes.push('Les zéros placés avant le premier chiffre non nul ne sont pas significatifs : ils indiquent seulement la place de la virgule.');
  if (d.digits.slice(0, lastNz).includes('0')) notes.push('Les zéros situés entre deux chiffres non nuls sont significatifs.');
  if (lastNz < d.digits.length) notes.push('Les zéros à la fin' + (sci ? ' de la mantisse' : ', après la virgule,') + ' sont significatifs : ils indiquent la précision.');
  if (sci) notes.push('En notation scientifique, on compte les chiffres de la mantisse ; la puissance de 10 ne compte pas.');
  const q = mk('A', level, 'int', 'Combien de chiffres significatifs comporte la valeur <b>' + sym + ' = ' + show + ' ' + unit + '</b> ?', {
    answer: d.digits.length,
    expl: 'Chiffres significatifs : <b>' + d.digits.split('').join(' ; ') + '</b> → <b>' + d.digits.length + ' CS</b>. ' + notes.join(' ')
  });
  return finalize(q);
}

const CONV = [['kg', 'g', 3, 'm'], ['g', 'kg', -3, 'm'], ['mL', 'L', -3, 'V'], ['L', 'mL', 3, 'V'], ['km', 'm', 3, 'd'], ['cm', 'm', -2, 'd'], ['mm', 'm', -3, 'd'], ['ms', 's', -3, 't']];
function genB(level) {
  if (level === 1) {
    const n = ri(2, 4);
    const digits = randDigits(n, { lastNonZero: Math.random() < 0.6 });
    const choices = [-4, -3, -2, -1];
    for (let p = 1; p <= n - 1; p++) choices.push(p);
    let d = { digits, power: pick(choices) };
    if (decIsAmbiguous(d)) d = { digits, power: -2 };
    const [sym, unit] = pick(CTX_A);
    const q = mk('B', 1, 'num', 'Écris <b>' + sym + ' = ' + fmtDec(d) + ' ' + unit + '</b> en notation scientifique, sans changer le nombre de chiffres significatifs (sans l\'unité).', {
      exp: d, requireSci: true, unit,
      expl: 'On déplace la virgule pour avoir un seul chiffre non nul avant elle : ' + fmtDec(d) + ' = <b>' + fmtSci(d) + '</b>. La valeur a ' + n + ' CS, la mantisse garde ces ' + n + ' chiffres' + (digits.endsWith('0') ? ', y compris le zéro final' : '') + '.'
    });
    return finalize(q);
  }
  if (level === 2) {
    const [u1, u2, k, sym] = pick(CONV);
    const n = 3;
    let d;
    do { d = { digits: randDigits(n, { lastNonZero: Math.random() < 0.5 }), power: ri(-1, 2) }; } while (decIsAmbiguous(d));
    const e = { digits: d.digits, power: d.power + k };
    const q = mk('B', 2, 'num', 'On mesure <b>' + sym + ' = ' + fmtDec(d) + ' ' + u1 + '</b>. Convertis cette valeur en <b>' + u2 + '</b>, en notation scientifique, sans changer le nombre de chiffres significatifs (sans l\'unité).', {
      exp: e, requireSci: true, unit: u2,
      expl: '1 ' + u1 + ' = ' + supPow(k) + ' ' + u2 + ', donc ' + sym + ' = ' + fmtSci(d) + ' × ' + supPow(k) + ' = <b>' + fmtSci(e) + ' ' + u2 + '</b>. Une conversion ne change pas la précision : on garde ' + n + ' CS.'
    });
    return finalize(q);
  }
  const digits = randDigits(3, { trailingZero: true });
  const p = ri(-1, 1);
  const d = { digits, power: p };
  const pg = p + 3;
  const good = fmtSci({ digits, power: pg }) + ' g';
  const intForm = fmtDec({ digits, power: pg }) + ' g';
  const lessCS = fmtSci({ digits: digits.replace(/0+$/, ''), power: pg }) + ' g';
  const wrongExp = fmtSci({ digits, power: pg + 1 }) + ' g';
  const opts = shuffle([good, intForm, lessCS, wrongExp]);
  const q = mk('B', 3, 'qcm', 'Une masse vaut <b>m = ' + fmtDec(d) + ' kg</b>. Quelle écriture de m en grammes respecte le nombre de chiffres significatifs ?', {
    options: opts, correct: opts.indexOf(good),
    expl: 'm a 3 CS. ' + intForm + ' est ambigu (on ne sait pas si les zéros de fin sont significatifs) ; ' + lessCS + ' n\'a que ' + digits.replace(/0+$/, '').length + ' CS ; ' + wrongExp + ' a une mauvaise puissance de 10. Bonne réponse : <b>' + good + '</b>.'
  });
  return finalize(q);
}

function genC(level) {
  const hint = ' <span class="muted">(utilise la notation scientifique si nécessaire)</span>';
  let d, n, variant = '';
  for (let guard = 0; guard < 200; guard++) {
    if (level === 1) { n = ri(2, 3); d = { digits: randDigits(6), power: ri(0, 2) }; }
    else if (level === 2) { n = ri(2, 3); d = { digits: randDigits(6), power: -ri(1, 4) }; }
    else {
      variant = pick(['carry', 'large', 'carry']);
      if (variant === 'carry') {
        n = ri(2, 3); const k = ri(1, n);
        const head = (n - k > 0 ? randDigits(n - k, { lastNonZero: false }) : '') + '9'.repeat(k);
        d = { digits: head + String(ri(5, 9)) + randDigits(2).slice(0, 2), power: ri(-2, 1) };
        if (d.digits[0] === '0') continue;
      } else { n = ri(2, 3); d = { digits: randDigits(ri(5, 6)), power: 0 }; d.power = d.digits.length - 1; }
    }
    const r = roundDigits(d, n);
    if ((level < 3) && decIsAmbiguous(r)) continue;
    const show = fmtDec(d);
    const nxt = d.digits[n];
    const q = mk('C', level, 'num', 'Arrondis <b>' + show + '</b> à <b>' + n + ' chiffres significatifs</b>.' + hint, {
      exp: r, unit: '',
      expl: 'On garde les ' + n + ' premiers chiffres significatifs (' + d.digits.slice(0, n).split('').join(' ') + '), le chiffre suivant est <b>' + nxt + '</b> ' + (+nxt >= 5 ? '(≥ 5) : on augmente le dernier chiffre gardé de 1' + (variant === 'carry' ? ', ce qui crée une retenue' : '') : '(&lt; 5) : on ne change rien') + '. Résultat : <b>' + fmt(r) + '</b>' + (needsSci(r) ? ' (en notation scientifique pour montrer clairement les ' + n + ' CS)' : '') + '.'
    });
    return finalize(q);
  }
  return genC(1);
}

/* données mesurées */
function datum(ncs, pmin, pmax) {
  for (let g = 0; g < 100; g++) {
    const d = { digits: randDigits(ncs, { lastNonZero: Math.random() < 0.6 }), power: ri(pmin, pmax) };
    if (!decIsAmbiguous(d)) return d;
  }
  return { digits: randDigits(ncs), power: pmin };
}
function showDatum(d) { return (d.power <= -3 && Math.random() < 0.6) ? fmtSci(d) : fmt(d); }
const CTX_D2 = [
  { f: 'c = n / V', a: ['n', 'mol', -4, -2], b: ['V', 'L', -2, -1], op: (x, y) => x / y, res: ['c', 'mol/L'] },
  { f: 'ρ = m / V', a: ['m', 'g', 0, 2], b: ['V', 'mL', 1, 2], op: (x, y) => x / y, res: ['ρ', 'g/mL'] },
  { f: 'v = d / t', a: ['d', 'm', 0, 3], b: ['t', 's', 0, 2], op: (x, y) => x / y, res: ['v', 'm/s'] },
  { f: 'm = n × M', a: ['n', 'mol', -3, -1], b: ['M', 'g/mol', 1, 2], op: (x, y) => x * y, res: ['m', 'g'] },
  { f: 'P = U × I', a: ['U', 'V', 0, 1], b: ['I', 'A', -2, -1], op: (x, y) => x * y, res: ['P', 'W'] }
];
function genD(level) {
  for (let g = 0; g < 200; g++) {
    if (level <= 2) {
      const c = pick(CTX_D2);
      let na = ri(2, 4), nb = ri(2, 4);
      if (na === nb) nb = na === 4 ? 3 : na + 1;
      const A = datum(na, c.a[2], c.a[3]), B = datum(nb, c.b[2], c.b[3]);
      const x = c.op(value(A), value(B));
      const nmin = Math.min(na, nb);
      const full = fromFloat(x);
      if (full.digits.slice(nmin, nmin + 9) === '499999999') continue;
      const r = roundDigits(full, nmin);
      const sA = showDatum(A), sB = showDatum(B);
      const data = 'On donne <b>' + c.a[0] + ' = ' + sA + ' ' + c.a[1] + '</b> et <b>' + c.b[0] + ' = ' + sB + ' ' + c.b[1] + '</b>.';
      const why = c.a[0] + ' a ' + na + ' CS et ' + c.b[0] + ' a ' + nb + ' CS → le résultat garde <b>' + nmin + ' CS</b> (la donnée la moins précise).';
      if (level === 1) {
        return finalize(mk('D', 1, 'int', data + ' On calcule <b>' + c.f + '</b>. Avec combien de chiffres significatifs faut-il écrire le résultat ?', { answer: nmin, expl: why }));
      }
      return finalize(mk('D', 2, 'num', data + ' Calcule <b>' + c.f + '</b> et écris le résultat avec le bon nombre de chiffres significatifs (en ' + c.res[1] + ', sans l\'unité).', {
        exp: r, unit: c.res[1],
        expl: why + ' Calculatrice : ' + c.res[0] + ' ≈ ' + fmt(stripZeros(roundDigits(full, 7))) + ' → <b>' + c.res[0] + ' = ' + fmt(r) + ' ' + c.res[1] + '</b>.'
      }));
    }
    const variant = pick(['mcvm', 'ec']);
    if (variant === 'mcvm') {
      const nc = ri(2, 4), nv = ri(2, 4), nM = ri(3, 4);
      const C = datum(nc, -2, -1), V = datum(nv, -2, -1), M = datum(nM, 1, 2);
      const nmin = Math.min(nc, nv, nM);
      const full = fromFloat(value(C) * value(V) * value(M));
      if (full.digits.slice(nmin, nmin + 9) === '499999999') continue;
      const r = roundDigits(full, nmin);
      return finalize(mk('D', 3, 'num', 'On dissout un soluté : <b>c = ' + showDatum(C) + ' mol/L</b>, <b>V = ' + fmt(V) + ' L</b>, <b>M = ' + fmt(M) + ' g/mol</b>. Calcule la masse <b>m = c × V × M</b> avec le bon nombre de chiffres significatifs (en g, sans l\'unité).', {
        exp: r, unit: 'g',
        expl: 'c : ' + nc + ' CS, V : ' + nv + ' CS, M : ' + nM + ' CS → le résultat garde <b>' + nmin + ' CS</b>. Calculatrice : m ≈ ' + fmt(stripZeros(roundDigits(full, 7))) + ' → <b>m = ' + fmt(r) + ' g</b>.'
      }));
    }
    const nm = ri(2, 4), nv = ri(2, 4);
    const Mm = datum(nm, -1, 1), Vv = datum(nv, 0, 1);
    const nmin = Math.min(nm, nv);
    const full = fromFloat(0.5 * value(Mm) * value(Vv) * value(Vv));
    if (full.digits.slice(nmin, nmin + 9) === '499999999') continue;
    const r = roundDigits(full, nmin);
    return finalize(mk('D', 3, 'num', 'Un objet de masse <b>m = ' + fmt(Mm) + ' kg</b> se déplace à <b>v = ' + fmt(Vv) + ' m/s</b>. Calcule son énergie cinétique <b>E<sub>c</sub> = ½ × m × v²</b> avec le bon nombre de chiffres significatifs (en J, sans l\'unité).', {
      exp: r, unit: 'J',
      expl: 'm : ' + nm + ' CS, v : ' + nv + ' CS. Le facteur ½ est un nombre exact : il ne limite pas la précision. Le résultat garde <b>' + nmin + ' CS</b>. Calculatrice : E<sub>c</sub> ≈ ' + fmt(stripZeros(roundDigits(full, 7))) + ' → <b>E<sub>c</sub> = ' + fmt(r) + ' J</b>.'
    }));
  }
  return genD(2);
}

function addDatum(dec, vmin, vmax) {
  for (let g = 0; g < 100; g++) {
    const f = Math.pow(10, dec);
    const R = ri(vmin * f, vmax * f - 1);
    if (dec === 0 && R % 10 === 0) continue;
    if (R <= 0) continue;
    return { R, dec };
  }
  return { R: vmin * Math.pow(10, dec) + 1, dec };
}
function sv(x) { return showInt(x.R, x.dec); }
const CTX_E = [['L', 'cm', 'Deux tiges de longueurs', 'sont mises bout à bout. Calcule la longueur totale'], ['m', 'g', 'Deux échantillons de masses', 'sont réunis. Calcule la masse totale'], ['V', 'mL', 'Deux volumes', 'sont mélangés (on suppose les volumes additifs). Calcule le volume total'], ['t', 's', 'Deux durées', 'se succèdent. Calcule la durée totale']];
function decWord(n) { return n + ' décimale' + (n > 1 ? 's' : ''); }
function genE(level) {
  for (let g = 0; g < 300; g++) {
    let terms, sign = 1, html, unit, sym, outDec, expl0 = '';
    if (level === 1 || (level === 2 && Math.random() < 0.5)) {
      const c = pick(CTX_E); sym = c[0]; unit = c[1];
      const n = level === 1 ? 2 : 3;
      const decs = shuffle([0, 1, 2, 3]).slice(0, n);
      terms = decs.map(dd => addDatum(dd, 1, 100));
      const names = terms.map((t, i) => sym + '<sub>' + (i + 1) + '</sub> = ' + sv(t) + ' ' + unit);
      html = (n === 3 ? c[2].replace('Deux', 'Trois') : c[2]) + ' <b>' + names.join('</b>, <b>') + '</b> ' + c[3] + ' <b>' + sym + ' = ' + terms.map((t, i) => sym + '<sub>' + (i + 1) + '</sub>').join(' + ') + '</b> avec le bon nombre de chiffres (en ' + unit + ', sans l\'unité).';
    } else if (level === 2) {
      sym = 'm'; unit = 'g';
      const decs = shuffle([0, 1, 2, 3]).slice(0, 2);
      const m1 = addDatum(decs[0], 20, 150), m2 = addDatum(decs[1], 200, 400);
      terms = [m2, m1]; sign = -1;
      html = 'Un bécher vide a une masse <b>m<sub>1</sub> = ' + sv(m1) + ' g</b>. Rempli de liquide, sa masse est <b>m<sub>2</sub> = ' + sv(m2) + ' g</b>. Calcule la masse de liquide <b>m = m<sub>2</sub> − m<sub>1</sub></b> avec le bon nombre de chiffres (en g, sans l\'unité).';
    } else {
      if (Math.random() < 0.5) {
        sym = 'm'; unit = 'g';
        const d1 = ri(2, 3), d2 = d1 - ri(1, d1);
        const m1 = addDatum(d1, 50, 150);
        const delta = ri(1, 19) * Math.pow(10, d1 - 1) + ri(0, 9);
        const v2 = m1.R + delta;
        const f = Math.pow(10, d1 - d2);
        let R2 = Math.round(v2 / f);
        if (d2 === 0 && R2 % 10 === 0) R2 += 1;
        const m2 = { R: R2, dec: d2 };
        if (m2.R * f <= m1.R) continue;
        terms = [m2, m1]; sign = -1;
        html = 'Une pesée donne <b>m<sub>1</sub> = ' + sv(m1) + ' g</b> pour un récipient vide et <b>m<sub>2</sub> = ' + sv(m2) + ' g</b> pour le récipient contenant un échantillon. Calcule la masse de l\'échantillon <b>m = m<sub>2</sub> − m<sub>1</sub></b> avec le bon nombre de chiffres (en g, sans l\'unité).';
        expl0 = ' Remarque : une soustraction de valeurs proches fait perdre des chiffres significatifs.';
      } else {
        const c = pick([['m', 'kg', 'g', 3], ['V', 'L', 'mL', 3], ['L', 'm', 'cm', 2]]);
        sym = c[0]; unit = c[1];
        const d1 = ri(2, 3), d2 = ri(0, 1);
        const a = addDatum(d1, 1, 5), b = addDatum(d2, 10, 900);
        const bConv = { R: b.R, dec: d2 + c[3] };
        terms = [a, bConv];
        html = 'On ajoute <b>' + sym + '<sub>1</sub> = ' + sv(a) + ' ' + c[1] + '</b> et <b>' + sym + '<sub>2</sub> = ' + sv(b) + ' ' + c[2] + '</b>. Calcule <b>' + sym + ' = ' + sym + '<sub>1</sub> + ' + sym + '<sub>2</sub></b> en <b>' + c[1] + '</b> avec le bon nombre de chiffres (sans l\'unité).';
        expl0 = ' On convertit d\'abord ' + sym + '<sub>2</sub> = ' + sv(b) + ' ' + c[2] + ' = ' + sv(bConv) + ' ' + c[1] + '.';
      }
    }
    const D = Math.max(...terms.map(t => t.dec));
    outDec = Math.min(...terms.map(t => t.dec));
    let Rsum = 0;
    terms.forEach((t, i) => { const v = t.R * Math.pow(10, D - t.dec); Rsum += (i === 0 || sign === 1) ? v : -v; });
    if (Rsum <= 0) continue;
    const Rr = roundIntTo(Rsum, D, outDec);
    if (Rr <= 0) continue;
    if (outDec === 0 && Rr % 10 === 0) continue;
    const e = fromIntKeep(Rr, outDec);
    e.digits = e.digits.replace(/^0+/, '');
    e.power = String(Rr).length - 1 - outDec;
    const raw = showInt(Rsum, D);
    const q = mk('E', level, 'num', html, {
      exp: e, unit,
      expl: 'Addition/soustraction : on regarde le nombre de <b>décimales</b> (le rang du dernier chiffre), pas le nombre de CS.' + expl0 + ' La donnée la moins précise a ' + decWord(outDec) + ' → le résultat garde <b>' + decWord(outDec) + '</b>. Calcul : ' + raw + ' → <b>' + sym + ' = ' + showInt(Rr, outDec) + ' ' + unit + '</b>.'
    });
    return finalize(q);
  }
  return genE(1);
}

const RANKS = { 1: 'des dixièmes', 2: 'des centièmes', 3: 'des millièmes', 4: 'des dix-millièmes' };
const CTX_F1 = [['g', 'm/s²', 5, 15], ['L', 'cm', 10, 90], ['T', 's', 1, 5], ['m', 'g', 10, 90], ['θ', '°C', 15, 40], ['f', 'Hz', 10, 90]];
const CTX_F2 = [['c', 'mol/L', [-3, -2]], ['f', 'Hz', [3, 4, 5]], ['λ', 'm', [-7, -6]], ['C', 'F', [-6, -5]]];
const CONCEPT_F = [
  { html: 'Un élève calcule d\'abord n = m / M, puis c = n / V. Que doit-il faire avec la valeur intermédiaire de n ?', good: 'La garder en mémoire dans la calculatrice et n\'arrondir que le résultat final c', bad: ['L\'arrondir à 1 chiffre significatif avant de calculer c', 'L\'arrondir à 2 chiffres significatifs avant de calculer c', 'Ne rien arrondir du tout, même le résultat final'], expl: 'Arrondir un résultat intermédiaire introduit une erreur qui se propage. On garde toutes les décimales pendant le calcul et on arrondit <b>seulement le résultat final</b>.' },
  { html: 'Un calcul donne u(T) = 0,06493 s. Comment écrire cette incertitude-type avec 1 chiffre significatif ?', good: 'u(T) = 0,07 s', bad: ['u(T) = 0,06 s', 'u(T) = 0,065 s', 'u(T) = 0,1 s'], expl: 'Une incertitude s\'arrondit toujours <b>par excès</b> : on ne doit pas la sous-estimer. 0,06493 s → <b>0,07 s</b>.' },
  { html: 'Avec combien de chiffres significatifs écrit-on une incertitude-type en Terminale ?', good: '1 seul chiffre significatif', bad: ['Autant que la valeur mesurée', 'Toujours 3 chiffres significatifs', 'Autant que la calculatrice en affiche'], expl: 'Par convention, l\'incertitude-type s\'écrit avec <b>un seul chiffre significatif</b>. C\'est ensuite elle qui fixe le dernier chiffre de la valeur.' }
];
function genF(level) {
  for (let g = 0; g < 300; g++) {
    if (level === 1) {
      if (Math.random() < 0.3) {
        const c = pick(CONCEPT_F);
        const opts = shuffle([c.good].concat(c.bad));
        return finalize(mk('F', 1, 'qcm', c.html, { options: opts, correct: opts.indexOf(c.good), expl: c.expl }));
      }
      const [sym, unit, vmin, vmax] = pick(CTX_F1);
      const dv = ri(4, 5);
      const V = addDatum(dv, vmin, vmax);
      const nu = 1;
      const du = ri(1, Math.min(3, dv - 2));
      const uR = nu === 1 ? ri(1, 9) : ri(10, 49);
      const uVal = uR / Math.pow(10, du), vVal = V.R / Math.pow(10, dv);
      if (uVal > 0.1 * vVal) continue;
      const Rr = roundIntTo(V.R, dv, du);
      const e = { digits: String(Rr), power: String(Rr).length - 1 - du };
      const q = mk('F', 1, 'num', 'Un calcul donne <b>' + sym + ' = ' + sv(V) + ' ' + unit + '</b>. L\'incertitude-type vaut <b>u(' + sym + ') = ' + showInt(uR, du) + ' ' + unit + '</b>. Écris la valeur de ' + sym + ' avec le nombre de chiffres adapté à cette incertitude (sans l\'unité).', {
        exp: e, unit,
        expl: 'Le dernier chiffre de u(' + sym + ') est au rang <b>' + RANKS[du] + '</b> → on arrondit ' + sym + ' au même rang : <b>' + sym + ' = ' + showInt(Rr, du) + ' ' + unit + '</b> avec u(' + sym + ') = ' + showInt(uR, du) + ' ' + unit + '.'
      });
      return finalize(q);
    }
    if (level === 2) {
      const [sym, unit, pows] = pick(CTX_F2);
      const pv = pick(pows);
      const V = { digits: randDigits(7), power: pv };
      const nu = 1;
      const U = { digits: nu === 1 ? String(ri(1, 9)) : String(ri(10, 49)), power: pv - ri(2, 3) };
      const rank = U.power - (nu - 1);
      const n = pv - rank + 1;
      if (n < 2) continue;
      const r = roundDigits(V, n);
      if (r.power > V.power) r.digits += '0'; // retenue (9,99… → 10,0…) : on garde le même rang
      const q = mk('F', 2, 'num', 'Un calcul donne <b>' + sym + ' = ' + fmtSci(V) + ' ' + unit + '</b> avec une incertitude-type <b>u(' + sym + ') = ' + fmtSci(U) + ' ' + unit + '</b>. Écris la valeur de ' + sym + ' avec le nombre de chiffres adapté à cette incertitude (sans l\'unité).', {
        exp: r, unit,
        expl: 'Le dernier chiffre de u(' + sym + ') est au rang ' + supPow(rank) + ' → on arrondit ' + sym + ' au même rang, soit ' + r.digits.length + ' CS : <b>' + sym + ' = ' + fmtSci(r) + ' ' + unit + '</b>.'
      });
      return finalize(q);
    }
    const [sym, unit] = pick([['T', 's'], ['g', 'm/s²'], ['L', 'm'], ['U', 'V']]);
    const V = addDatum(6, 1, 9);
    const uR = ri(1001, 8999);
    if (uR % 1000 === 0 || uR % 1000 >= 500) continue; // cas où l'arrondi au plus proche diminuerait u
    const u1 = Math.ceil(uR / 1000);           // incertitude arrondie PAR EXCÈS à 1 CS
    const uLow = Math.floor(uR / 1000);        // erreur fréquente : arrondi au plus proche (vers le bas)
    if (uLow < 1) continue;
    const vGood = showInt(roundIntTo(V.R, 6, 2), 2);
    const vFine = showInt(roundIntTo(V.R, 6, 3), 3);
    const good = sym + ' = ' + vGood + ' ' + unit + ' ; u(' + sym + ') = ' + showInt(u1, 2) + ' ' + unit;
    const opts0 = [good,
      sym + ' = ' + sv(V) + ' ' + unit + ' ; u(' + sym + ') = ' + showInt(u1, 2) + ' ' + unit,
      sym + ' = ' + vFine + ' ' + unit + ' ; u(' + sym + ') = ' + showInt(u1, 2) + ' ' + unit,
      sym + ' = ' + vGood + ' ' + unit + ' ; u(' + sym + ') = ' + showInt(uLow, 2) + ' ' + unit];
    if (new Set(opts0).size < 4) continue;
    const opts = shuffle(opts0);
    const q = mk('F', 3, 'qcm', 'Le calcul donne <b>' + sym + ' = ' + sv(V) + ' ' + unit + '</b> et une incertitude-type <b>u(' + sym + ') = ' + showInt(uR, 5) + ' ' + unit + '</b>. Quelle écriture du résultat est correcte ?', {
      options: opts, correct: opts.indexOf(good),
      expl: 'On écrit u(' + sym + ') avec 1 CS, en arrondissant <b>par excès</b> (on ne doit jamais sous-estimer une incertitude) : ' + showInt(uR, 5) + ' → ' + showInt(u1, 2) + ' ' + unit + ' (et non ' + showInt(uLow, 2) + '). Son dernier chiffre est au rang des centièmes : on arrondit la valeur au même rang → <b>' + good + '</b>.'
    });
    return finalize(q);
  }
  return genF(1);
}


const FICHES = {
A: `
<h3>De quoi parle-t-on ?</h3>
<p>Les <b>chiffres significatifs</b> (CS) d'une valeur sont les chiffres qui ont un sens physique : tous les chiffres connus avec certitude, plus le dernier, qui est estimé. Ils traduisent la <b>précision</b> de la mesure.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Écrire <b>m = 12 g</b> ou <b>m = 12,00 g</b>, ce n'est pas la même chose : la deuxième écriture indique une mesure au centième de gramme près. Le nombre de CS est une information, au même titre que la valeur et l'unité.</p>
<h3>Règles d'application</h3>
<ul>
<li>Tous les chiffres <b>non nuls</b> sont significatifs : 4,72 → 3 CS.</li>
<li>Les zéros <b>entre</b> deux chiffres non nuls sont significatifs : 1,05 → 3 CS.</li>
<li>Les zéros <b>à gauche</b> (avant le premier chiffre non nul) ne sont <b>pas</b> significatifs : ils indiquent seulement la place de la virgule. 0,0023 → 2 CS.</li>
<li>Les zéros <b>à droite, après la virgule</b>, sont significatifs : 2,50 → 3 CS.</li>
<li>En notation scientifique, on compte les chiffres de la mantisse : 3,040×10<sup>−3</sup> → 4 CS. La puissance de 10 ne compte pas.</li>
<li>Un nombre entier terminé par des zéros (2 500) est <b>ambigu</b> : on ne sait pas si ces zéros sont significatifs. On utilise alors la notation scientifique : 2,5×10<sup>3</sup> (2 CS) ou 2,50×10<sup>3</sup> (3 CS).</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">m = 0,02050 g. On commence au premier chiffre non nul : <b>2 ; 0 ; 5 ; 0</b> → <b>4 CS</b>. Les deux zéros de gauche ne comptent pas, le zéro du milieu et le zéro final comptent.</div>`,
B: `
<h3>De quoi parle-t-on ?</h3>
<p>La <b>notation scientifique</b> d'un nombre s'écrit <b>a×10<sup>n</sup></b>, avec <b>1 ≤ a &lt; 10</b> (un seul chiffre non nul avant la virgule) et n un entier relatif. Le nombre a s'appelle la mantisse.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Elle montre <b>sans ambiguïté</b> le nombre de chiffres significatifs (ce sont les chiffres de la mantisse), elle permet d'écrire simplement des valeurs très grandes ou très petites, et elle permet de changer d'unité sans changer la précision.</p>
<h3>Règles d'application</h3>
<ul>
<li>On déplace la virgule pour n'avoir qu'un chiffre non nul devant elle. Virgule déplacée vers la gauche → n augmente ; vers la droite → n diminue. 0,00452 = 4,52×10<sup>−3</sup> ; 345,2 = 3,452×10<sup>2</sup>.</li>
<li>La mantisse garde <b>tous</b> les CS, y compris les zéros finaux : 0,0500 = 5,00×10<sup>−2</sup> (3 CS).</li>
<li><b>Une conversion d'unités ne change pas le nombre de CS</b> : 2,50 kg = 2,50×10<sup>3</sup> g (et non « 2 500 g », qui est ambigu).</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">V = 25,0 mL en litres : 1 mL = 10<sup>−3</sup> L, donc V = 2,50×10<sup>1</sup> × 10<sup>−3</sup> = <b>2,50×10<sup>−2</sup> L</b> (toujours 3 CS).</div>`,
C: `
<h3>De quoi parle-t-on ?</h3>
<p><b>Arrondir à n chiffres significatifs</b>, c'est ne garder que les n premiers chiffres significatifs, en ajustant le dernier.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>La calculatrice affiche souvent 8 ou 10 chiffres, mais la plupart n'ont aucun sens physique : ils dépassent la précision des mesures. Il faut savoir arrondir proprement le résultat final.</p>
<h3>Règles d'application</h3>
<ul>
<li>On compte n chiffres à partir du <b>premier chiffre non nul</b>.</li>
<li>On regarde le chiffre suivant : s'il vaut <b>0, 1, 2, 3 ou 4</b>, on garde le dernier chiffre tel quel ; s'il vaut <b>5, 6, 7, 8 ou 9</b>, on augmente le dernier chiffre de 1.</li>
<li>Une retenue peut se propager : 9,996 arrondi à 3 CS donne <b>10,0</b>.</li>
<li>Il faut écrire les zéros nécessaires : 2,996 à 3 CS donne <b>3,00</b> (et non 3).</li>
<li>Si le résultat est un grand entier, on passe en notation scientifique : 45 678 à 2 CS donne <b>4,6×10<sup>4</sup></b>.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">0,0346829 à 3 CS : on garde 3, 4, 6 ; le chiffre suivant est 8 (≥ 5) → <b>0,0347</b> (ou 3,47×10<sup>−2</sup>).</div>`,
D: `
<h3>De quoi parle-t-on ?</h3>
<p>Lorsqu'on <b>multiplie</b> ou qu'on <b>divise</b> des grandeurs mesurées (c = n/V, m = n×M, v = d/t…), il faut choisir avec combien de CS écrire le résultat.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Un résultat ne peut pas être plus précis que les données qui ont servi à le calculer. Donner trop de chiffres, c'est annoncer une précision qu'on n'a pas.</p>
<h3>Règles d'application</h3>
<div class="rule">Le résultat d'une multiplication ou d'une division s'écrit avec autant de CS que la donnée qui en a le moins.</div>
<ul>
<li>On compte les CS de chaque donnée, on garde le plus petit nombre.</li>
<li>On fait le calcul complet, puis on arrondit <b>seulement le résultat final</b>.</li>
<li>Les nombres <b>exacts</b> (le facteur ½ dans E<sub>c</sub> = ½ m v², un nombre d'objets comptés…) ne limitent pas le nombre de CS.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">n = 2,35×10<sup>−3</sup> mol (3 CS) et V = 0,0500 L (3 CS). c = n / V = 0,047 à la calculatrice → 3 CS → <b>c = 4,70×10<sup>−2</sup> mol/L</b>.</div>`,
E: `
<h3>De quoi parle-t-on ?</h3>
<p>Lorsqu'on <b>additionne</b> ou qu'on <b>soustrait</b> des grandeurs (masse totale, différence de deux pesées…), la règle n'est pas la même que pour × et ÷.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Dans une addition, ce qui compte est la <b>position du dernier chiffre</b> (dixièmes, centièmes…). Ajouter 12,5 cm (connu au dixième) et 3,27 cm (connu au centième) donne un résultat connu seulement au dixième.</p>
<h3>Règles d'application</h3>
<div class="rule">On exprime tout dans la même unité ; le résultat garde autant de décimales que la donnée qui en a le moins.</div>
<ul>
<li>Toujours convertir d'abord dans la même unité.</li>
<li>Repérer la donnée qui a le moins de décimales, arrondir le résultat à ce rang.</li>
<li>Une soustraction de valeurs proches fait perdre des CS : 25,43 − 25,1 = <b>0,3</b> (1 seul CS).</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">L = 12,5 cm + 3,27 cm = 15,77 cm à la calculatrice. La donnée la moins précise a 1 décimale → <b>L = 15,8 cm</b>.</div>
<p class="muted" style="font-size:.85rem">Remarque : cette règle des décimales est la règle usuelle des manuels. Quand une incertitude est connue, c'est elle qui décide (voir la fiche « Résultat final et incertitude »).</p>`,
F: `
<h3>De quoi parle-t-on ?</h3>
<p>Au lycée, un résultat de mesure s'accompagne souvent de son <b>incertitude-type</b> u(x). C'est elle qui fixe le nombre de chiffres à écrire pour la valeur x.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>L'incertitude dit à partir de quel chiffre la valeur n'est plus fiable. Écrire g = 9,81273 m/s² avec u(g) = 0,02 m/s² n'a pas de sens : les chiffres après les centièmes sont inconnus.</p>
<h3>Règles d'application</h3>
<ul>
<li>En Terminale, l'incertitude-type s'écrit avec <b>un seul chiffre significatif</b> (dans l'enseignement supérieur, on en garde parfois 2, selon la précision du matériel).</li>
<li>L'incertitude s'arrondit toujours <b>par excès</b> : on ne doit jamais la sous-estimer. u(T) = 0,06493 s → <b>0,07 s</b> (et non 0,06 s).</li>
<li>On arrondit la valeur x <b>au même rang</b> que le dernier chiffre de u(x), dans la même unité.</li>
<li>La <b>valeur</b> x, elle, s'arrondit normalement, à la valeur la plus proche (si le premier chiffre supprimé est 5 ou plus, on augmente le dernier chiffre gardé).</li>
<li>On n'arrondit <b>jamais les résultats intermédiaires</b> : on garde les valeurs en mémoire dans la calculatrice et on arrondit seulement à la fin.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Calcul : g = 9,81273 m/s², u(g) = 0,0234 m/s² → arrondie par excès à 1 CS : u(g) = 0,03 m/s² (dernier chiffre : centièmes) → <b>g = 9,81 m/s²</b> avec u(g) = 0,03 m/s².</div>
<p class="muted" style="font-size:.85rem">Source : ressource éduscol « Mesure et incertitudes » (ministère de l'Éducation nationale, mai 2021).</p>`
};

(window.RPC_NOTIONS = window.RPC_NOTIONS || {})['chiffres-significatifs'] = {
  titre: 'Chiffres significatifs',
  niveau: 'Terminale – spécialité physique-chimie',
  themes: THEMES,
  rappels: RAPPELS,
  fiches: FICHES,
  gen: { A: genA, B: genB, C: genC, D: genD, E: genE, F: genF },
  testLevels: { A: [2, 3], B: [1, 2], C: [2, 3], D: [1, 2], E: [1, 2], F: [1, 3] },
  aide: 'Pour écrire une puissance de 10, tape par exemple <b>4,70×10^-3</b> ou <b>4,70e-3</b>. La virgule ou le point sont acceptés.'
};
})();
