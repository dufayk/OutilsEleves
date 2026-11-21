/* =====================================================================
   NOTION : Vecteurs position, vitesse et accélération (Terminale – spécialité)
   Dérivée d'un vecteur, coordonnées horaires, primitives et conditions initiales,
   chronophotographie, mouvement circulaire et repère de Frenet.
   ===================================================================== */
(function () {
'use strict';
const { ri, pick, shuffle, MINUS, fmt, roundDigits, fromFloat, lastPow, mk, finalize } = window.NUM;

const THEMES = {
  A: 'Vecteur position et équations horaires',
  B: 'Dériver une fonction du temps',
  C: 'Vecteur vitesse = dérivée de la position',
  D: 'Vecteur accélération = dérivée de la vitesse',
  E: 'Remonter de l\'accélération à la position',
  F: 'Vitesse et accélération sur une chronophotographie',
  G: 'Mouvement circulaire et repère de Frenet'
};
const RAPPELS = {
  A: 'OM⃗(x(t) ; y(t)) : on remplace t par sa valeur dans chaque équation horaire. Distance OM = √(x² + y²).',
  B: 'Dérivées : constante → 0 ; a·t → a ; c·t² → 2c·t. On dérive terme par terme.',
  C: 'v⃗ = dOM⃗/dt : v<sub>x</sub> = dx/dt et v<sub>y</sub> = dy/dt. Valeur : v = √(v<sub>x</sub>² + v<sub>y</sub>²).',
  D: 'a⃗ = dv⃗/dt = d²OM⃗/dt² : a<sub>x</sub> = dv<sub>x</sub>/dt. Mouvement rectiligne uniforme ⇔ a⃗ = 0⃗.',
  E: 'On cherche une primitive, puis on fixe la constante avec les conditions initiales : v<sub>y</sub>(0) = v<sub>0y</sub>, y(0) = y<sub>0</sub>. Axe y vers le haut : a<sub>y</sub> = −g.',
  F: 'v<sub>i</sub> ≈ M<sub>i−1</sub>M<sub>i+1</sub> / (2τ) et a<sub>i</sub> ≈ (v<sub>i+1</sub> − v<sub>i−1</sub>) / (2τ), en unités SI (m, s).',
  G: 'Repère de Frenet : a⃗ = (dv/dt) u⃗<sub>t</sub> + (v²/R) u⃗<sub>n</sub>. Circulaire uniforme : a = v²/R, vers le centre.'
};

/* ---------- écriture ---------- */
const V = (s, sub) => '<span class="vec">' + s + (sub !== undefined ? '<sub>' + sub + '</sub>' : '') + '</span>';
const Z = V('0');
const nb = (x, dp) => (x < 0 ? MINUS : '') + Math.abs(x).toFixed(dp || 0).replace('.', ',');
function sig(x, n) { if (x === 0) return '0'; return (x < 0 ? MINUS : '') + fmt(roundDigits(fromFloat(x), n)); }
function sigTol(x, n) { if (x === 0) return 1e-9; return 0.5 * Math.pow(10, lastPow(roundDigits(fromFloat(x), n))) * 1.0001; }
const rad = d => d * Math.PI / 180;
const G0 = 9.81;
const OM = V('OM');
/* polynôme c2·t² + c1·t + c0 écrit proprement (dp décimales) */
function poly(c2, c1, c0, dp) {
  const terms = [];
  if (c2) terms.push([c2, 't²']);
  if (c1) terms.push([c1, 't']);
  if (c0 || !terms.length) terms.push([c0, '']);
  return terms.map(([c, t], i) => {
    const a = Math.abs(c), s = c < 0 ? (i ? ' − ' : MINUS) : (i ? ' + ' : '');
    const coef = a.toFixed(dp).replace('.', ',') + (t ? ' ' : '');
    return s + coef + t;
  }).join('');
}
const d1 = () => ri(5, 60) / 10 * (Math.random() < 0.5 ? -1 : 1);
function qcm(theme, level, html, good, bad, expl) { const o = shuffle([good].concat(bad)); return finalize(mk(theme, level, 'qcm', html, { options: o, correct: o.indexOf(good), expl })); }
function val(theme, level, html, v, show, unit, expl, o) {
  o = o || {};
  if (o.traps) { const tl = o.tol != null ? o.tol : 0.01 * Math.abs(v); o.traps = o.traps.filter(t => isFinite(t.val) && Math.abs(t.val - v) > tl && Math.abs(t.val + v) > tl); }
  return finalize(mk(theme, level, 'val', html, Object.assign({ val: v, show, unit, expl }, o)));
}
const RAD_MSG = 'Ta calculatrice est en radians : passe-la en degrés.';

/* ---------- A : position ---------- */
function genA(level) {
  if (level === 1) {
    const a = d1(), b = d1(), t = ri(1, 9) / 2, x = a * t + b;
    return val('A', 1, 'Un mobile se déplace sur l\'axe x selon l\'équation horaire <b>x(t) = ' + poly(0, a, b, 1) + '</b> (x en m, t en s). Calcule sa position x à la date t = ' + nb(t, 1) + ' s.',
      x, nb(x, 2), 'm', 'On remplace t par ' + nb(t, 1) + ' : x = ' + nb(a, 1) + ' × ' + nb(t, 1) + ' + (' + nb(b, 1) + ') = <b>' + nb(x, 2) + ' m</b>.',
      { tol: 0.006, traps: [{ val: a * t, msg: 'Tu as oublié la position initiale (le terme constant) ' + nb(b, 1) + ' m.' }, { val: a + b, msg: 'Il faut multiplier le coefficient par t.' }] });
  }
  if (level === 2) {
    const h = ri(0, 30) / 10, v0y = ri(20, 120) / 10, t = ri(2, 12) / 10;
    const y = -0.5 * G0 * t * t + v0y * t + h;
    return val('A', 2, 'Un ballon est lancé ; son altitude est donnée par <b>y(t) = ' + MINUS + '4,905 t² + ' + nb(v0y, 1) + ' t' + (h ? ' + ' + nb(h, 1) : '') + '</b> (y en m, t en s). Calcule y à la date t = ' + nb(t, 1) + ' s (3 chiffres significatifs).',
      y, sig(y, 3), 'm', 'y = −4,905 × ' + nb(t, 1) + '² + ' + nb(v0y, 1) + ' × ' + nb(t, 1) + (h ? ' + ' + nb(h, 1) : '') + ' ≈ <b>' + sig(y, 3) + ' m</b>. Attention : t² se calcule avant de multiplier par −4,905.',
      { tol: sigTol(y, 3), traps: [{ val: 4.905 * t * t + v0y * t + h, msg: 'Le signe du terme en t² est négatif (la pesanteur fait descendre le ballon).' }, { val: -4.905 * t + v0y * t + h, msg: 'Tu as oublié le carré : c\'est t², pas t.' }, { val: -4.905 * t * t + v0y * t, msg: 'Tu as oublié l\'altitude de départ (terme constant).' }, { val: Math.pow(-4.905 * t, 2) + v0y * t + h, msg: 'Seul t est au carré : −4,905 × t², et non (−4,905 t)².' }] });
  }
  const vx = ri(10, 60) / 10, a = ri(5, 30) / 10, t = ri(1, 6) / 2, x = vx * t, y = a * t * t, d = Math.hypot(x, y);
  return val('A', 3, 'Le vecteur position d\'un point M est ' + OM + '(x(t) = ' + poly(0, vx, 0, 1) + ' ; y(t) = ' + poly(a, 0, 0, 1) + ') en m. Calcule la distance OM à la date t = ' + nb(t, 1) + ' s (3 chiffres significatifs).',
    d, sig(d, 3), 'm', 'À t = ' + nb(t, 1) + ' s : x = ' + sig(x, 3) + ' m et y = ' + sig(y, 3) + ' m. OM est la valeur de ' + OM + ' : OM = √(x² + y²) ≈ <b>' + sig(d, 3) + ' m</b>.',
    { tol: sigTol(d, 3), traps: [{ val: x + y, msg: 'Tu as additionné les coordonnées : la valeur d\'un vecteur se calcule avec √(x² + y²).' }, { val: x * x + y * y, msg: 'Tu as oublié la racine carrée.' }] });
}

/* ---------- B : dériver ---------- */
function genB(level) {
  if (level === 1) {
    const a = d1(); let b; do { b = d1(); } while (Math.abs(b) === Math.abs(a));
    if (Math.random() < 0.5) return qcm('B', 1, 'Quelle est la dérivée par rapport au temps de <b>f(t) = ' + poly(0, a, b, 1) + '</b> ?',
      nb(a, 1), [nb(a, 1) + ' t', nb(b, 1), poly(0, a, b, 1)],
      'On dérive terme par terme : la dérivée de ' + nb(a, 1) + ' t est ' + nb(a, 1) + ', la dérivée d\'une constante est 0. Donc f\'(t) = <b>' + nb(a, 1) + '</b>.');
    const c = ri(1, 9) * (Math.random() < 0.5 ? -1 : 1) / 2;
    return qcm('B', 1, 'Quelle est la dérivée par rapport au temps de <b>f(t) = ' + poly(c, 0, b, 1) + '</b> ?',
      poly(0, 2 * c, 0, 1), [poly(0, c, 0, 1), poly(0, 2 * c, b, 1), poly(2 * c, 0, 0, 1)],
      'La dérivée de c·t² est 2c·t, celle d\'une constante est 0 : f\'(t) = 2 × ' + nb(c, 1) + ' t = <b>' + poly(0, 2 * c, 0, 1) + '</b>.');
  }
  if (level === 2) {
    const c = ri(2, 30) / 10 * (Math.random() < 0.5 ? -1 : 1), a = d1(), b = d1(), t = ri(1, 8) / 2, dv = 2 * c * t + a;
    return val('B', 2, 'On donne <b>x(t) = ' + poly(c, a, b, 1) + '</b>. Calcule la valeur de la dérivée dx/dt à la date t = ' + nb(t, 1) + ' s.',
      dv, nb(dv, 2), '', 'dx/dt = 2 × ' + nb(c, 1) + ' t + ' + nb(a, 1) + ' = ' + poly(0, 2 * c, a, 1) + '. À t = ' + nb(t, 1) + ' s : <b>' + nb(dv, 2) + '</b>.',
      { tol: 0.006, traps: [{ val: c * t + a, msg: 'La dérivée de c·t² est <b>2</b>c·t (tu as oublié le facteur 2).' }, { val: c * t * t + a * t + b, msg: 'Tu as calculé x(t) au lieu de sa dérivée.' }, { val: 2 * c * t + a + b, msg: 'La dérivée d\'une constante est 0 : le terme constant disparaît.' }, { val: 2 * c * t, msg: 'La dérivée de ' + nb(a, 1) + ' t est ' + nb(a, 1) + ' : il ne faut pas l\'oublier.' }] });
  }
  const v0 = ri(5, 25), al = pick([20, 30, 40, 45, 50, 60]), h = ri(0, 20) / 10;
  const bank = [
    () => qcm('B', 3, 'Pour un projectile, x(t) = (v<sub>0</sub> cos α) t, avec v<sub>0</sub> et α constants. Que vaut la dérivée seconde d²x/dt² ?',
      '0', ['v<sub>0</sub> cos α', 'v<sub>0</sub> sin α', MINUS + 'g'],
      'dx/dt = v<sub>0</sub> cos α est une <b>constante</b>, donc sa dérivée est nulle : d²x/dt² = <b>0</b>. Sur l\'axe horizontal, le mouvement est uniforme.'),
    () => qcm('B', 3, 'On donne y(t) = −½ g t² + (v<sub>0</sub> sin α) t + h, avec g, v<sub>0</sub>, α et h constants. Quelle est l\'expression de dy/dt ?',
      MINUS + 'g t + v<sub>0</sub> sin α', [MINUS + '½ g t + v<sub>0</sub> sin α', MINUS + 'g t + v<sub>0</sub> sin α + h', MINUS + 'g t + v<sub>0</sub> cos α'],
      'Terme par terme : (−½ g t²)\' = −g t ; ((v<sub>0</sub> sin α) t)\' = v<sub>0</sub> sin α ; (h)\' = 0. Donc dy/dt = <b>−g t + v<sub>0</sub> sin α</b>.'),
    () => { const t = ri(2, 12) / 10, vy = -G0 * t + v0 * Math.sin(rad(al));
      return val('B', 3, 'y(t) = −4,905 t² + (' + v0 + ' × sin ' + al + '°) t + ' + nb(h, 1) + ' (en m). Calcule dy/dt à t = ' + nb(t, 1) + ' s (3 chiffres significatifs).',
        vy, sig(vy, 3), 'm/s', 'dy/dt = −9,81 t + ' + v0 + ' sin ' + al + '°. À t = ' + nb(t, 1) + ' s : ≈ <b>' + sig(vy, 3) + ' m/s</b>.',
        { tol: sigTol(vy, 3), traps: [{ val: -4.905 * t + v0 * Math.sin(rad(al)), msg: 'La dérivée de −4,905 t² est −9,81 t (facteur 2).' }, { val: -G0 * t + v0 * Math.cos(rad(al)), msg: 'C\'est sin α, comme dans l\'équation de départ.' }, { val: -G0 * t + v0 * Math.sin(al), msg: RAD_MSG }, { val: -4.905 * t * t + v0 * Math.sin(rad(al)) * t + h, msg: 'Tu as calculé y(t) au lieu de sa dérivée.' }] }); }
  ];
  return pick(bank)();
}

/* ---------- C : vitesse ---------- */
function genC(level) {
  if (level === 1) return pick([
    () => qcm('C', 1, 'Comment est défini le vecteur vitesse ' + V('v') + ' d\'un point M ?',
      V('v') + ' = d' + OM + '/dt', [V('v') + ' = ' + OM + ' / t', V('v') + ' = d' + V('a') + '/dt', 'v = x(t) + y(t)'],
      'Le vecteur vitesse est la <b>dérivée</b> du vecteur position par rapport au temps : ' + V('v') + ' = d' + OM + '/dt. ' + OM + '/t n\'est qu\'une vitesse moyenne depuis l\'origine.'),
    () => qcm('C', 1, 'Le vecteur vitesse ' + V('v') + ' d\'un point M est toujours :',
      'tangent à la trajectoire, dans le sens du mouvement', ['dirigé vers le centre de la trajectoire', 'perpendiculaire à la trajectoire', 'dirigé vers l\'origine O du repère'],
      V('v') + ' est <b>tangent à la trajectoire</b> et orienté dans le sens du mouvement. C\'est l\'accélération qui, dans un virage, pointe vers l\'intérieur.')
  ])();
  if (level === 2) {
    const c = ri(2, 30) / 10 * (Math.random() < 0.5 ? -1 : 1), a = d1(), b = d1(), t = ri(1, 8) / 2, ax = pick(['x', 'y']);
    const vv = 2 * c * t + a;
    return val('C', 2, 'Le vecteur position est ' + OM + '(' + (ax === 'x' ? 'x(t) = ' + poly(c, a, b, 1) + ' ; y(t) = ' + poly(0, d1(), d1(), 1) : 'x(t) = ' + poly(0, d1(), d1(), 1) + ' ; y(t) = ' + poly(c, a, b, 1)) + ') en m. Calcule la coordonnée v<sub>' + ax + '</sub> du vecteur vitesse à t = ' + nb(t, 1) + ' s.',
      vv, nb(vv, 2), 'm/s', 'v<sub>' + ax + '</sub> = d' + ax + '/dt = ' + poly(0, 2 * c, a, 1) + '. À t = ' + nb(t, 1) + ' s : v<sub>' + ax + '</sub> = <b>' + nb(vv, 2) + ' m/s</b>.',
      { tol: 0.006, traps: [{ val: c * t * t + a * t + b, msg: 'Tu as calculé la position ' + ax + '(t) : la vitesse est sa <b>dérivée</b>.' }, { val: c * t + a, msg: 'La dérivée de c·t² est 2c·t (facteur 2 oublié).' }, { val: 2 * c * t + a + b, msg: 'La dérivée du terme constant est 0.' }] });
  }
  const vx = ri(10, 80) / 10, vy0 = ri(10, 120) / 10, t = ri(1, 15) / 10, vy = vy0 - G0 * t, v = Math.hypot(vx, vy);
  return val('C', 3, 'Pour un projectile : v<sub>x</sub>(t) = ' + nb(vx, 1) + ' et v<sub>y</sub>(t) = ' + poly(0, -9.81, vy0, 2) + ' (en m/s). Calcule la <b>valeur</b> v de la vitesse à t = ' + nb(t, 1) + ' s (3 chiffres significatifs).',
    v, sig(v, 3), 'm/s', 'À t = ' + nb(t, 1) + ' s : v<sub>y</sub> = ' + sig(vy, 3) + ' m/s. v = √(v<sub>x</sub>² + v<sub>y</sub>²) = √(' + nb(vx, 1) + '² + (' + sig(vy, 3) + ')²) ≈ <b>' + sig(v, 3) + ' m/s</b>. Une valeur est toujours positive.',
    { tol: sigTol(v, 3), traps: [{ val: vx + vy, msg: 'Tu as additionné les coordonnées : v = √(v<sub>x</sub>² + v<sub>y</sub>²).' }, { val: vx + Math.abs(vy), msg: 'Tu as additionné les coordonnées : v = √(v<sub>x</sub>² + v<sub>y</sub>²).' }, { val: vy, msg: 'Tu as donné seulement v<sub>y</sub> : la valeur du vecteur utilise les deux coordonnées.' }, { val: Math.hypot(vx, vy0), msg: 'Tu as pris la vitesse initiale : remplace t par ' + nb(t, 1) + ' s dans v<sub>y</sub>(t).' }] });
}

/* ---------- D : accélération ---------- */
function genD(level) {
  if (level === 1) return pick([
    () => qcm('D', 1, 'Comment est défini le vecteur accélération ' + V('a') + ' ?',
      V('a') + ' = d' + V('v') + '/dt = d²' + OM + '/dt²', [V('a') + ' = d' + OM + '/dt', 'a = v / t', V('a') + ' = ' + V('v') + ' / t'],
      V('a') + ' est la dérivée du vecteur vitesse, donc la dérivée seconde du vecteur position. d' + OM + '/dt, c\'est la vitesse.'),
    () => qcm('D', 1, 'Un mobile a un mouvement <b>rectiligne uniforme</b>. Que vaut son vecteur accélération ?',
      'Le vecteur nul ' + Z, ['Un vecteur dans le sens du mouvement', 'Un vecteur de sens opposé au mouvement', 'On ne peut pas savoir sans la valeur de la vitesse'],
      'Rectiligne uniforme : ' + V('v') + ' ne change ni en valeur ni en direction, donc ' + V('a') + ' = d' + V('v') + '/dt = ' + Z + '. (Principe d\'inertie : la somme des forces est nulle.)')
  ])();
  if (level === 2) {
    if (Math.random() < 0.5) {
      const c = ri(2, 40) / 10 * (Math.random() < 0.5 ? -1 : 1), a = d1(), b = d1();
      return val('D', 2, 'On donne x(t) = ' + poly(c, a, b, 1) + ' (en m). Calcule la coordonnée a<sub>x</sub> de l\'accélération.',
        2 * c, nb(2 * c, 1), 'm/s²', 'v<sub>x</sub> = dx/dt = ' + poly(0, 2 * c, a, 1) + ', puis a<sub>x</sub> = dv<sub>x</sub>/dt = <b>' + nb(2 * c, 1) + ' m/s²</b> (constante).',
        { tol: 0.006, traps: [{ val: c, msg: 'Deux dérivations : (c t²)\'\' = 2c. Tu as oublié le facteur 2.' }, { val: a, msg: 'Tu as pris le coefficient de t : c\'est la vitesse initiale, pas l\'accélération.' }, { val: 0, msg: 'L\'accélération n\'est nulle que si x(t) est une fonction affine de t. Ici il y a un terme en t².' }] });
    }
    const v0 = ri(20, 120) / 10;
    return qcm('D', 2, 'La vitesse verticale d\'une bille vaut v<sub>y</sub>(t) = ' + poly(0, -9.81, v0, 2) + ' (en m/s, axe y vers le haut). Que vaut a<sub>y</sub> ?',
      MINUS + '9,81 m/s²', ['9,81 m/s²', nb(v0, 1) + ' m/s²', '0 m/s²'],
      'a<sub>y</sub> = dv<sub>y</sub>/dt = <b>−9,81 m/s²</b>. Le signe − vient de l\'axe y orienté vers le haut alors que ' + V('g') + ' est vers le bas. (C\'est une coordonnée : elle peut être négative.)');
  }
  return qcm('D', 3, 'Quelle affirmation est vraie ?', pick([
    'Dans un mouvement circulaire uniforme, ' + V('a') + ' n\'est pas nul',
    'Si ' + V('a') + ' et ' + V('v') + ' ont le même sens, le mouvement est accéléré',
    'Si ' + V('a') + ' et ' + V('v') + ' sont de sens opposés, le mouvement est ralenti'
  ]), shuffle([
    'Si la valeur de la vitesse est constante, ' + V('a') + ' = ' + Z,
    'Le vecteur accélération est toujours tangent à la trajectoire',
    'L\'accélération a = v / t dans tous les cas',
    'Si ' + V('a') + ' = ' + Z + ', le mobile est forcément immobile'
  ]).slice(0, 3),
  V('a') + ' mesure la variation du <b>vecteur</b> vitesse (valeur <b>et</b> direction). Vitesse de valeur constante dans un virage : ' + V('a') + ' ≠ ' + Z + '. ' + V('a') + ' = ' + Z + ' signifie mouvement rectiligne uniforme (ou repos). a⃗ et v⃗ de même sens : accéléré ; de sens opposés : ralenti.');
}

/* ---------- E : primitives et conditions initiales ---------- */
function genE(level) {
  if (level === 1) {
    const v0 = ri(10, 90) / 10;
    return qcm('E', 1, 'Une bille est lancée verticalement vers le haut avec la vitesse v<sub>0</sub> = ' + nb(v0, 1) + ' m/s. Axe y vers le haut, a<sub>y</sub> = −g. Quelle est l\'expression de v<sub>y</sub>(t) ?',
      'v<sub>y</sub>(t) = −g t + ' + nb(v0, 1), ['v<sub>y</sub>(t) = −g t', 'v<sub>y</sub>(t) = g t + ' + nb(v0, 1), 'v<sub>y</sub>(t) = −½ g t² + ' + nb(v0, 1)],
      'Une primitive de −g est −g t + C. La constante C se trouve avec la condition initiale v<sub>y</sub>(0) = v<sub>0</sub> = ' + nb(v0, 1) + ' m/s. Donc <b>v<sub>y</sub>(t) = −g t + ' + nb(v0, 1) + '</b>. Oublier la constante est l\'erreur la plus fréquente.');
  }
  if (level === 2) {
    const v0 = ri(5, 30), al = pick([20, 25, 30, 35, 40, 50, 55, 60, 65, 70]), ask = pick(['x', 'y']);
    const r = ask === 'x' ? v0 * Math.cos(rad(al)) : v0 * Math.sin(rad(al)), o = ask === 'x' ? v0 * Math.sin(rad(al)) : v0 * Math.cos(rad(al));
    return val('E', 2, 'Un ballon est lancé avec une vitesse v<sub>0</sub> = ' + v0 + ' m/s faisant un angle α = ' + al + '° avec l\'horizontale (axe x horizontal, axe y vertical vers le haut). Calcule la coordonnée v<sub>0' + ask + '</sub> de la vitesse initiale (3 chiffres significatifs).',
      r, sig(r, 3), 'm/s', 'On projette ' + V('v', 0) + ' : v<sub>0x</sub> = v<sub>0</sub> cos α et v<sub>0y</sub> = v<sub>0</sub> sin α. Ici v<sub>0' + ask + '</sub> = ' + v0 + ' × ' + (ask === 'x' ? 'cos' : 'sin') + ' ' + al + '° ≈ <b>' + sig(r, 3) + ' m/s</b>.',
      { tol: sigTol(r, 3), traps: [{ val: o, msg: 'Tu as confondu cos et sin : l\'angle est mesuré depuis l\'horizontale, donc v<sub>0x</sub> = v<sub>0</sub> cos α.' }, { val: v0, msg: 'Il faut projeter la vitesse initiale sur l\'axe.' }, { val: v0 * (ask === 'x' ? Math.cos(al) : Math.sin(al)), msg: RAD_MSG }] });
  }
  const v0 = ri(8, 25), al = pick([30, 35, 40, 45, 50, 60]), h = ri(0, 25) / 10;
  if (Math.random() < 0.5) {
    const ts = v0 * Math.sin(rad(al)) / G0;
    return val('E', 3, 'Un projectile est lancé avec v<sub>0</sub> = ' + v0 + ' m/s sous un angle α = ' + al + '° (g = 9,81 m/s², axe y vers le haut). On a v<sub>y</sub>(t) = −g t + v<sub>0</sub> sin α. À quelle date t<sub>S</sub> atteint-il le sommet de sa trajectoire ? (3 chiffres significatifs)',
      ts, sig(ts, 3), 's', 'Au sommet, la vitesse est horizontale : v<sub>y</sub>(t<sub>S</sub>) = 0, donc t<sub>S</sub> = v<sub>0</sub> sin α / g = ' + v0 + ' × sin ' + al + '° / 9,81 ≈ <b>' + sig(ts, 3) + ' s</b>.',
      { tol: sigTol(ts, 3), traps: [{ val: v0 * Math.cos(rad(al)) / G0, msg: 'C\'est v<sub>y</sub> qui s\'annule au sommet : on utilise v<sub>0</sub> sin α.' }, { val: v0 / G0, msg: 'Il faut la composante verticale v<sub>0</sub> sin α, pas v<sub>0</sub>.' }, { val: 2 * ts, msg: 'Ça, c\'est (pour h = 0) la durée du vol complet : le sommet est atteint à mi-parcours.' }] });
  }
  const t = ri(2, 12) / 10, y = -0.5 * G0 * t * t + v0 * Math.sin(rad(al)) * t + h;
  return val('E', 3, 'Un projectile part de l\'altitude h = ' + nb(h, 1) + ' m avec v<sub>0</sub> = ' + v0 + ' m/s sous un angle α = ' + al + '° (g = 9,81 m/s², axe y vers le haut). Établis y(t) puis calcule l\'altitude à t = ' + nb(t, 1) + ' s (3 chiffres significatifs).',
    y, sig(y, 3), 'm', 'a<sub>y</sub> = −g → v<sub>y</sub> = −g t + v<sub>0</sub> sin α → y = −½ g t² + (v<sub>0</sub> sin α) t + h. À t = ' + nb(t, 1) + ' s : y ≈ <b>' + sig(y, 3) + ' m</b>.',
    { tol: sigTol(y, 3), traps: [{ val: -G0 * t * t + v0 * Math.sin(rad(al)) * t + h, msg: 'Une primitive de −g t est −½ g t² : tu as oublié le ½.' }, { val: 0.5 * G0 * t * t + v0 * Math.sin(rad(al)) * t + h, msg: 'Axe y vers le haut : a<sub>y</sub> = −g, donc le terme en t² est négatif.' }, { val: -0.5 * G0 * t * t + v0 * Math.sin(rad(al)) * t, msg: 'Tu as oublié la condition initiale y(0) = h.' }, { val: -0.5 * G0 * t * t + v0 * Math.cos(rad(al)) * t + h, msg: 'Sur l\'axe vertical, c\'est v<sub>0</sub> sin α.' }, { val: -0.5 * G0 * t * t + v0 * Math.sin(al) * t + h, msg: RAD_MSG }] });
}

/* ---------- F : chronophotographie ---------- */
function genF(level) {
  if (level === 1) {
    const tau = pick([20, 40, 50, 60, 80, 100]), d = ri(20, 150) / 10, v = d / 100 / (2 * tau / 1000), i = ri(2, 8);
    return val('F', 1, 'Sur une chronophotographie, l\'intervalle entre deux positions est τ = ' + tau + ' ms. On mesure M<sub>' + (i - 1) + '</sub>M<sub>' + (i + 1) + '</sub> = ' + nb(d, 1) + ' cm. Calcule la valeur approchée de la vitesse v<sub>' + i + '</sub> en m/s (2 chiffres significatifs).',
      v, sig(v, 2), 'm/s', 'v<sub>' + i + '</sub> ≈ M<sub>' + (i - 1) + '</sub>M<sub>' + (i + 1) + '</sub> / (2τ) = ' + sig(d / 100, 3) + ' m / (2 × ' + sig(tau / 1000, 2) + ' s) ≈ <b>' + sig(v, 2) + ' m/s</b>. On convertit d\'abord en mètres et en secondes.',
      { tol: sigTol(v, 2), traps: [{ val: 2 * v, msg: 'Entre M<sub>' + (i - 1) + '</sub> et M<sub>' + (i + 1) + '</sub>, il s\'écoule <b>2τ</b>, pas τ.' }, { val: v * 100, msg: 'Convertis la distance en mètres (1 cm = 10<sup>−2</sup> m).' }, { val: v / 1000, msg: 'Convertis la durée en secondes (1 ms = 10<sup>−3</sup> s).' }, { val: v * 100 / 1000, msg: 'Convertis la distance en m et la durée en s.' }, { val: 2 * v * 100, msg: 'Deux erreurs : la durée est 2τ, et la distance doit être en mètres.' }] });
  }
  if (level === 2) {
    const tau = pick([0.04, 0.05, 0.1]), v1 = ri(5, 40) / 10, dv = ri(2, 15) / 10 * (Math.random() < 0.7 ? 1 : -1), v3 = Math.max(0.1, v1 + dv), a = (v3 - v1) / (2 * tau), i = ri(2, 8);
    return val('F', 2, 'Sur une chronophotographie (τ = ' + nb(tau * 1000, 0) + ' ms), on a calculé v<sub>' + (i - 1) + '</sub> = ' + nb(v1, 1) + ' m/s et v<sub>' + (i + 1) + '</sub> = ' + nb(v3, 1) + ' m/s, les vitesses étant colinéaires et de même sens. Calcule la coordonnée a<sub>' + i + '</sub> de l\'accélération sur l\'axe du mouvement (2 chiffres significatifs, avec son signe).',
      a, sig(a, 2), 'm/s²', 'a<sub>' + i + '</sub> ≈ (v<sub>' + (i + 1) + '</sub> − v<sub>' + (i - 1) + '</sub>) / (2τ) = (' + nb(v3, 1) + ' − ' + nb(v1, 1) + ') / ' + nb(2 * tau, 2) + ' ≈ <b>' + sig(a, 2) + ' m/s²</b>.' + (a < 0 ? ' Le signe − indique un mouvement ralenti (' + V('a') + ' opposé à ' + V('v') + ').' : ''),
      { tol: sigTol(a, 2), traps: [{ val: 2 * a, msg: 'Entre les positions ' + (i - 1) + ' et ' + (i + 1) + ', il s\'écoule <b>2τ</b>.' }, { val: (v3 - v1) / (2 * tau * 1000), msg: 'Convertis τ en secondes.' }, { val: (v3 + v1) / (2 * tau), msg: 'L\'accélération utilise une <b>différence</b> de vitesses.' }], signMsg: 'Attention à l\'ordre : a ≈ (v<sub>' + (i + 1) + '</sub> − v<sub>' + (i - 1) + '</sub>) / (2τ), « après − avant ».' });
  }
  const OPTS = ['Il a la direction et le sens du mouvement', 'Il a la direction du mouvement mais le sens opposé', 'Il est nul', 'Il est perpendiculaire à la trajectoire'];
  const [desc, k] = pick([['de plus en plus espacées', 0], ['de plus en plus rapprochées', 1], ['régulièrement espacées', 2]]);
  return qcm('F', 3, 'Sur une chronophotographie, les positions successives sont alignées et ' + desc + '. Que peut-on dire du vecteur accélération ?',
    OPTS[k], OPTS.filter((_, i) => i !== k),
    'Positions alignées : mouvement rectiligne. Espacement croissant : accéléré, ' + V('a') + ' dans le sens de ' + V('v') + '. Espacement décroissant : ralenti, ' + V('a') + ' opposé à ' + V('v') + '. Espacement régulier : uniforme, ' + V('a') + ' = ' + Z + '.');
}

/* ---------- G : circulaire, Frenet ---------- */
function genG(level) {
  if (level === 1) return pick([
    () => qcm('G', 1, 'Dans un mouvement circulaire <b>uniforme</b> de rayon R, le vecteur accélération est :',
      'dirigé vers le centre, de valeur v²/R', ['nul, car la valeur de la vitesse est constante', 'tangent à la trajectoire, de valeur v²/R', 'dirigé vers l\'extérieur du cercle, de valeur v²/R'],
      'La valeur de la vitesse est constante mais sa <b>direction</b> change : ' + V('a') + ' ≠ ' + Z + '. Dans le repère de Frenet, ' + V('a') + ' = (v²/R) ' + V('u', 'n') + ' : il est <b>centripète</b>.'),
    () => qcm('G', 1, 'Dans le repère de Frenet, comment s\'écrit le vecteur accélération ?',
      V('a') + ' = (dv/dt) ' + V('u', 't') + ' + (v²/R) ' + V('u', 'n'), [V('a') + ' = (v²/R) ' + V('u', 't') + ' + (dv/dt) ' + V('u', 'n'), V('a') + ' = (dv/dt) ' + V('u', 't'), 'a = dv/dt + v²/R'],
      'Composante tangentielle a<sub>t</sub> = dv/dt (variation de la valeur de la vitesse) ; composante normale a<sub>n</sub> = v²/R (changement de direction), dirigée vers le centre. La dernière écriture additionne des valeurs : faux.')
  ])();
  if (level === 2) {
    const ctx = pick([['Un manège tourne', ri(2, 12), ri(30, 120) / 10, 'une nacelle'], ['Une voiture aborde un virage circulaire', ri(10, 35), ri(30, 200), 'la voiture'], ['Un satellite est en orbite circulaire', ri(30, 79) * 100, ri(66, 90) * 1e5, 'le satellite']]);
    const [txt, v, R, who] = ctx, a = v * v / R;
    return val('G', 2, txt + ' : ' + who + ' a un mouvement circulaire uniforme de rayon R = ' + (R >= 1e5 ? sig(R, 2) : nb(R, R % 1 ? 1 : 0)) + ' m à la vitesse v = ' + v + ' m/s. Calcule la valeur de son accélération (2 chiffres significatifs).',
      a, sig(a, 2), 'm/s²', 'Mouvement circulaire uniforme : a = v²/R = ' + v + '² / ' + (R >= 1e5 ? sig(R, 2) : nb(R, R % 1 ? 1 : 0)) + ' ≈ <b>' + sig(a, 2) + ' m/s²</b>, dirigée vers le centre.',
      { tol: sigTol(a, 2), traps: [{ val: 0, msg: 'La vitesse est constante en valeur, mais sa direction change : l\'accélération n\'est pas nulle.' }, { val: v / R, msg: 'C\'est v² / R : n\'oublie pas le carré.' }, { val: v * v * R, msg: 'On divise par R : a = v² / R.' }] });
  }
  const R = ri(20, 200), v = ri(5, 30), at = ri(5, 40) / 10, an = v * v / R, a = Math.hypot(at, an);
  return val('G', 3, 'Une voiture roule sur un virage circulaire de rayon R = ' + R + ' m. À un instant, v = ' + v + ' m/s et elle accélère : dv/dt = ' + nb(at, 1) + ' m/s². Calcule la valeur de son accélération (2 chiffres significatifs).',
    a, sig(a, 2), 'm/s²', 'a<sub>t</sub> = dv/dt = ' + nb(at, 1) + ' m/s² et a<sub>n</sub> = v²/R = ' + sig(an, 3) + ' m/s². Ces composantes sont perpendiculaires : a = √(a<sub>t</sub>² + a<sub>n</sub>²) ≈ <b>' + sig(a, 2) + ' m/s²</b>.',
    { tol: sigTol(a, 2), traps: [{ val: at + an, msg: 'Tu as additionné les valeurs (flèches retirées) : ' + V('u', 't') + ' et ' + V('u', 'n') + ' sont perpendiculaires, il faut Pythagore.' }, { val: at, msg: 'Il manque la composante normale v²/R (le virage).' }, { val: an, msg: 'Il manque la composante tangentielle dv/dt (la voiture accélère).' }] });
}

/* ---------- fiches ---------- */
const FICHES = {
A: `
<h3>De quoi parle-t-on ?</h3>
<p>Dans un repère (O ; x, y), la position d'un point M à la date t est donnée par le <b>vecteur position</b> ${OM}. Ses coordonnées x(t) et y(t) sont les <b>équations horaires</b> du mouvement.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Les équations horaires permettent de prévoir où se trouve le mobile à n'importe quelle date (portée d'un tir, altitude maximale, date d'impact…).</p>
<h3>Règles d'application</h3>
<ul>
<li>Pour trouver la position à une date, on <b>remplace t</b> par sa valeur dans x(t) et y(t).</li>
<li>On calcule t² <b>avant</b> de multiplier par son coefficient : −4,905 t², et non (−4,905 t)².</li>
<li>Le terme constant est la position initiale : x(0), y(0).</li>
<li>La distance OM est la <b>valeur</b> du vecteur position : OM = √(x² + y²).</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">y(t) = −4,905 t² + 8,0 t + 1,5. À t = 0,50 s : y = −4,905 × 0,25 + 8,0 × 0,50 + 1,5 = −1,23 + 4,0 + 1,5 ≈ <b>4,27 m</b>.</div>`,
B: `
<h3>De quoi parle-t-on ?</h3>
<p>Dériver une grandeur par rapport au temps donne sa <b>vitesse de variation</b>. On note dx/dt (ou ẋ) la dérivée de x(t).</p>
<h3>Pourquoi est-ce important ?</h3>
<p>La vitesse est la dérivée de la position ; l'accélération est la dérivée de la vitesse. Toute la cinématique de Terminale repose sur ces dérivées.</p>
<h3>Règles d'application</h3>
<div class="rule">(constante)' = 0 &nbsp; ; &nbsp; (a t)' = a &nbsp; ; &nbsp; (c t²)' = 2c t &nbsp; ; &nbsp; on dérive terme par terme.</div>
<ul>
<li>Les lettres g, v<sub>0</sub>, α, h sont des <b>constantes</b> : v<sub>0</sub> cos α se dérive comme un nombre.</li>
<li>(−½ g t²)' = −g t : le 2 de la dérivée annule le ½.</li>
<li>Dérivée seconde : on dérive deux fois. (c t²)'' = 2c.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">x(t) = 1,5 t² − 2,0 t + 4,0 → dx/dt = <b>3,0 t − 2,0</b> → d²x/dt² = <b>3,0</b>.<br><span class="muted">Erreurs fréquentes : oublier le facteur 2 (1,5 t − 2,0), ou garder la constante (3,0 t − 2,0 + 4,0).</span></div>`,
C: `
<h3>De quoi parle-t-on ?</h3>
<p>Le <b>vecteur vitesse</b> est la dérivée du vecteur position : ${V('v')} = d${OM}/dt. Ses coordonnées sont v<sub>x</sub> = dx/dt et v<sub>y</sub> = dy/dt.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>${V('v')} donne la direction du mouvement à chaque instant : il est <b>tangent à la trajectoire</b>, dans le sens du mouvement.</p>
<h3>Règles d'application</h3>
<ul>
<li>On dérive <b>chaque coordonnée</b> séparément.</li>
<li>Valeur de la vitesse : <b>v = √(v<sub>x</sub>² + v<sub>y</sub>²)</b>, toujours positive. Une coordonnée (v<sub>y</sub> qui descend, par exemple) peut être négative.</li>
<li>On écrit ${V('v')} pour le vecteur, v pour la valeur : jamais « ${V('v')} = 5 m/s ».</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">x(t) = 3,0 t ; y(t) = −4,905 t² + 6,0 t. Donc v<sub>x</sub> = 3,0 et v<sub>y</sub> = −9,81 t + 6,0. À t = 1,0 s : v<sub>y</sub> = −3,81 m/s, v = √(3,0² + 3,81²) ≈ <b>4,8 m/s</b>.</div>`,
D: `
<h3>De quoi parle-t-on ?</h3>
<p>Le <b>vecteur accélération</b> est la dérivée du vecteur vitesse : ${V('a')} = d${V('v')}/dt = d²${OM}/dt². Il mesure comment le <b>vecteur</b> vitesse change : en valeur <b>et</b> en direction.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>La deuxième loi de Newton relie l'accélération aux forces : Σ${V('F')} = m${V('a')}. Connaître ${V('a')}, c'est connaître la somme des forces (et inversement).</p>
<h3>Règles d'application</h3>
<ul>
<li>a<sub>x</sub> = dv<sub>x</sub>/dt et a<sub>y</sub> = dv<sub>y</sub>/dt.</li>
<li>Rectiligne uniforme ⇔ ${V('a')} = ${Z}.</li>
<li>${V('a')} et ${V('v')} de même sens : mouvement accéléré ; de sens opposés : ralenti.</li>
<li>Vitesse de valeur constante dans un virage : ${V('a')} ≠ ${Z} (la direction change).</li>
<li>Chute libre avec un axe y vers le haut : a<sub>y</sub> = −g (coordonnée négative).</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">v<sub>x</sub> = 3,0 ; v<sub>y</sub> = −9,81 t + 6,0 → a<sub>x</sub> = 0 et a<sub>y</sub> = <b>−9,81 m/s²</b> : ${V('a')} = ${V('g')}, vertical vers le bas.</div>`,
E: `
<h3>De quoi parle-t-on ?</h3>
<p>Souvent, on connaît ${V('a')} (par la deuxième loi de Newton) et on cherche ${V('v')} puis ${OM}. On fait le chemin inverse de la dérivation : on cherche des <b>primitives</b>.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>C'est la méthode de tous les exercices « mouvement dans un champ uniforme » : chute libre, tir de projectile, particule chargée entre deux plaques.</p>
<h3>Règles d'application</h3>
<ul>
<li>Primitive d'une constante a : a t + C ; primitive de a t + b : ½ a t² + b t + C.</li>
<li>Chaque primitive a une <b>constante</b> C, fixée par les <b>conditions initiales</b> : v<sub>x</sub>(0) = v<sub>0x</sub>, x(0) = x<sub>0</sub>…</li>
<li>Vitesse initiale inclinée d'un angle α sur l'horizontale : <b>v<sub>0x</sub> = v<sub>0</sub> cos α</b> et <b>v<sub>0y</sub> = v<sub>0</sub> sin α</b>.</li>
<li>Au sommet de la trajectoire : v<sub>y</sub> = 0.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">a<sub>y</sub> = −g → v<sub>y</sub>(t) = −g t + v<sub>0</sub> sin α → y(t) = −½ g t² + (v<sub>0</sub> sin α) t + h. Sommet : t<sub>S</sub> = v<sub>0</sub> sin α / g.</div>`,
F: `
<h3>De quoi parle-t-on ?</h3>
<p>Une chronophotographie montre les positions M<sub>0</sub>, M<sub>1</sub>, M<sub>2</sub>… d'un mobile à intervalles de temps réguliers τ. On en déduit des valeurs <b>approchées</b> de la vitesse et de l'accélération.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>C'est la méthode expérimentale (pointage vidéo, tableur, Python) qui permet de vérifier la deuxième loi de Newton.</p>
<h3>Règles d'application</h3>
<div class="rule">v<sub>i</sub> ≈ M<sub>i−1</sub>M<sub>i+1</sub> / (2τ) &nbsp;;&nbsp; ${V('a')}<sub>i</sub> ≈ (${V('v')}<sub>i+1</sub> − ${V('v')}<sub>i−1</sub>) / (2τ)</div>
<ul>
<li>Entre M<sub>i−1</sub> et M<sub>i+1</sub>, il s'écoule <b>2τ</b>.</li>
<li>On convertit en <b>unités SI</b> : distances en m, durées en s.</li>
<li>${V('v')}<sub>i</sub> est tangent à la trajectoire en M<sub>i</sub> ; ${V('a')}<sub>i</sub> se construit avec la différence de deux vecteurs vitesse (voir la notion « Vecteurs »).</li>
<li>Positions alignées et régulièrement espacées : mouvement rectiligne uniforme, ${V('a')} = ${Z}.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">τ = 40 ms, M<sub>2</sub>M<sub>4</sub> = 6,4 cm → v<sub>3</sub> ≈ 0,064 / 0,080 = <b>0,80 m/s</b>.</div>`,
G: `
<h3>De quoi parle-t-on ?</h3>
<p>Pour un mouvement circulaire de rayon R, on utilise le <b>repère de Frenet</b>, lié au mobile : ${V('u', 't')} tangent à la trajectoire (sens du mouvement) et ${V('u', 'n')} perpendiculaire, dirigé vers le centre.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>C'est le repère adapté aux satellites, aux planètes, aux virages et aux manèges : il sépare ce qui change la <b>valeur</b> de la vitesse de ce qui change sa <b>direction</b>.</p>
<h3>Règles d'application</h3>
<div class="rule">${V('a')} = (dv/dt) ${V('u', 't')} + (v²/R) ${V('u', 'n')}</div>
<ul>
<li>Mouvement circulaire <b>uniforme</b> : dv/dt = 0, donc ${V('a')} = (v²/R) ${V('u', 'n')} : accélération <b>centripète</b>, de valeur <b>a = v²/R</b>.</li>
<li>Si la vitesse varie : a<sub>t</sub> = dv/dt et a<sub>n</sub> = v²/R sont perpendiculaires, donc a = √(a<sub>t</sub>² + a<sub>n</sub>²) (et non a<sub>t</sub> + a<sub>n</sub>).</li>
<li>${V('v')} = v ${V('u', 't')} : la vitesse n'a pas de composante normale.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Une voiture à 20 m/s dans un virage de rayon 80 m, à vitesse constante : a = 20² / 80 = <b>5,0 m/s²</b>, vers le centre du virage.</div>`
};

(window.RPC_NOTIONS = window.RPC_NOTIONS || {})['vecteurs-mouvement'] = {
  titre: 'Vecteurs position, vitesse et accélération',
  niveau: 'Terminale – spécialité',
  themes: THEMES,
  rappels: RAPPELS,
  fiches: FICHES,
  gen: { A: genA, B: genB, C: genC, D: genD, E: genE, F: genF, G: genG },
  testLevels: { A: [1, 2], B: [1, 2], C: [2, 3], D: [1, 2], E: [2, 3], F: [1, 2], G: [1, 2] },
  aide: 'Les vecteurs sont notés avec une flèche (' + V('v') + '), leurs valeurs sans flèche (v). Nombre négatif : bouton « − ». Puissance de 10 : par exemple <b>3,2×10^-2</b>. Calculatrice en <b>degrés</b>, g = 9,81 m/s².'
};
})();
