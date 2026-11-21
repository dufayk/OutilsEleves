/* =====================================================================
   NOTION : Les vecteurs en physique-chimie (Seconde → Terminale)
   Points : écriture vecteur / valeur, coordonnées et norme, somme, différence
   (vecteur variation de vitesse), produit par un nombre, projection, produit scalaire.
   Types de questions : 'qcm' et 'val' (nombre signé jugé avec une tolérance, messages
   ciblés sur les erreurs typiques via traps / signMsg).
   ===================================================================== */
(function () {
'use strict';
const { ri, pick, shuffle, MINUS, fmt, roundDigits, fromFloat, lastPow, mk, finalize } = window.NUM;

const THEMES = {
  A: 'Vecteur ou valeur : bien écrire',
  B: 'Coordonnées et norme',
  C: 'Somme de vecteurs',
  D: 'Différence de vecteurs, variation de vitesse',
  E: 'Multiplier un vecteur par un nombre',
  F: 'Projeter un vecteur sur des axes',
  G: 'Produit scalaire et travail'
};
const RAPPELS = {
  A: 'Pour chaque signe « = » : des vecteurs des deux côtés, ou des nombres des deux côtés. La valeur F d\'un vecteur F⃗ s\'écrit sans flèche et n\'est jamais négative. Le vecteur nul s\'écrit 0⃗.',
  B: 'u⃗(x ; y) : x se lit horizontalement (positif vers la droite), y verticalement (positif vers le haut). AB⃗(x<sub>B</sub> − x<sub>A</sub> ; y<sub>B</sub> − y<sub>A</sub>). Norme : u = √(x² + y²).',
  C: 'Les coordonnées s\'additionnent. Les valeurs ne s\'additionnent que si les vecteurs sont colinéaires et de même sens ; perpendiculaires : Pythagore.',
  D: 'Δv⃗ = v⃗<sub>2</sub> − v⃗<sub>1</sub> = v⃗<sub>2</sub> + (−v⃗<sub>1</sub>). Coordonnées : « arrivée − départ ». Δv = v<sub>2</sub> − v<sub>1</sub> seulement si les vecteurs sont colinéaires et de même sens.',
  E: 'k·u⃗ a la même direction que u⃗ ; même sens si k &gt; 0, sens opposé si k &lt; 0 ; valeur |k| × u (jamais négative).',
  F: 'Dans le triangle rectangle : côté adjacent à l\'angle → cos, côté opposé → sin. Une coordonnée est négative si le vecteur pointe contre l\'axe.',
  G: 'u⃗·v⃗ = u × v × cos θ = xx\' + yy\' : c\'est un nombre, qui peut être négatif. Travail : W = F × AB × cos α.'
};

/* ---------- écriture ---------- */
const V = (s, sub) => '<span class="vec">' + s + (sub !== undefined ? '<sub>' + sub + '</sub>' : '') + '</span>';
const Z = V('0');
const S = (s, sub) => '<i>' + s + '</i>' + (sub !== undefined ? '<sub>' + sub + '</sub>' : '');   // valeur (sans flèche)
const nb = (x, dp) => (x < 0 ? MINUS : '') + Math.abs(x).toFixed(dp || 0).replace('.', ',');
function sig(x, n) { if (x === 0) return '0'; return (x < 0 ? MINUS : '') + fmt(roundDigits(fromFloat(x), n)); }
function sigTol(x, n) { if (x === 0) return 1e-9; return 0.5 * Math.pow(10, lastPow(roundDigits(fromFloat(x), n))) * 1.0001; }
const sgn = () => (Math.random() < 0.5 ? -1 : 1);
const nz = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };
const rad = d => d * Math.PI / 180;
const coord = (x, y) => '(' + x + ' ; ' + y + ')';
const formula = h => '<div class="formula">' + h + '</div>';

function qcmFixed(theme, level, html, options, correct, expl) { return finalize(mk(theme, level, 'qcm', html, { options, correct, expl })); }
function qcm(theme, level, html, good, bad, expl) { const o = shuffle([good].concat(bad)); return qcmFixed(theme, level, html, o, o.indexOf(good), expl); }
/* question à réponse numérique : v = valeur exacte, show = réponse affichée, o = {tol, traps, signMsg, helper} */
function val(theme, level, html, v, show, unit, expl, o) {
  o = o || {};
  if (o.traps) { const tl = o.tol != null ? o.tol : 0.01 * Math.abs(v); o.traps = o.traps.filter(t => Math.abs(t.val - v) > tl && Math.abs(t.val + v) > tl); }
  return finalize(mk(theme, level, 'val', html, Object.assign({ val: v, show, unit, expl }, o || {}))); }

/* ---------- figures ---------- */
let uid = 0;
const COLS = ['#1f5fa8', '#b3261e', '#1d7a46', '#8a5a00'];
function defs(id) {
  return '<defs>' + COLS.map((c, i) => '<marker id="' + id + 'm' + i + '" viewBox="0 0 10 10" refX="8.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto"><path d="M0,0L10,5L0,10z" fill="' + c + '"/></marker>').join('') + '</defs>';
}
function label(x, y, name, sub, col) {
  // nom du vecteur + petite flèche au-dessus
  const w = 11 + (sub !== undefined ? 8 : 0);
  return '<text x="' + x + '" y="' + y + '" fill="' + col + '" style="fill:' + col + '" text-anchor="middle">' + name + (sub !== undefined ? '<tspan font-size="12" dy="5">' + sub + '</tspan>' : '') + '</text>' +
    '<path d="M' + (x - w / 2) + ',' + (y - 18) + 'h' + w + 'm-5,-3.5l5,3.5l-5,3.5" stroke="' + col + '" fill="none" stroke-width="1.6"/>';
}
/* vecs : [{x0, y0, dx, dy, name, sub, c}] en carreaux ; y vers le haut */
function figGrid(vecs) {
  const id = 'g' + (++uid) + Math.floor(Math.random() * 1e6);
  const xs = [], ys = [];
  vecs.forEach(v => { xs.push(v.x0, v.x0 + v.dx); ys.push(v.y0, v.y0 + v.dy); });
  const x0 = Math.min(...xs) - 2, x1 = Math.max(...xs) + 2, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
  const c = 38, W = (x1 - x0) * c, H = (y1 - y0) * c;
  const X = x => (x - x0) * c, Y = y => (y1 - y) * c;
  let s = '<svg class="fig" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Vecteurs sur un quadrillage">' + defs(id);
  for (let x = x0; x <= x1; x++) s += '<line class="grid" x1="' + X(x) + '" y1="0" x2="' + X(x) + '" y2="' + H + '"/>';
  for (let y = y0; y <= y1; y++) s += '<line class="grid" x1="0" y1="' + Y(y) + '" x2="' + W + '" y2="' + Y(y) + '"/>';
  vecs.forEach(v => {
    const ci = v.c || 0, col = COLS[ci];
    const ax = X(v.x0), ay = Y(v.y0), bx = X(v.x0 + v.dx), by = Y(v.y0 + v.dy);
    s += '<circle cx="' + ax + '" cy="' + ay + '" r="3.5" fill="' + col + '"/>';
    s += '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by + '" stroke="' + col + '" stroke-width="2.6" marker-end="url(#' + id + 'm' + ci + ')"/>';
    const L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L;
    s += label((ax + bx) / 2 + nx * 22, (ay + by) / 2 + ny * 22 + 6, v.name, v.sub, col);
  });
  return s + '</svg>';
}
/* vecteur de valeur F faisant l'angle alpha avec l'axe horizontal ; sx, sy = ±1 (sens) */
function figAngle(alpha, sx, sy, name, sub) {
  const id = 'a' + (++uid) + Math.floor(Math.random() * 1e6);
  const W = 300, H = 230, ox = 150, oy = 115, R = 95;
  const tx = ox + sx * R * Math.cos(rad(alpha)), ty = oy - sy * R * Math.sin(rad(alpha));
  let s = '<svg class="fig" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Vecteur et angle">' + defs(id);
  s += '<line class="axis" x1="20" y1="' + oy + '" x2="' + (W - 20) + '" y2="' + oy + '" marker-end="url(#' + id + 'm3)"/><text x="' + (W - 22) + '" y="' + (oy + 20) + '">x</text>';
  s += '<line class="axis" x1="' + ox + '" y1="' + (H - 10) + '" x2="' + ox + '" y2="14" marker-end="url(#' + id + 'm3)"/><text x="' + (ox + 8) + '" y="22">y</text>';
  s += '<text x="' + (ox - 16) + '" y="' + (oy + 18) + '">O</text>';
  s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + tx + '" y2="' + ty + '" stroke="' + COLS[0] + '" stroke-width="2.8" marker-end="url(#' + id + 'm0)"/>';
  const r = 34, sxp = ox + sx * r, ex = ox + sx * r * Math.cos(rad(alpha)), ey = oy - sy * r * Math.sin(rad(alpha));
  const sweep = (sx * sy > 0) ? 0 : 1;
  s += '<path d="M' + sxp + ',' + oy + ' A' + r + ',' + r + ' 0 0 ' + sweep + ' ' + ex + ',' + ey + '" fill="none" stroke="' + COLS[1] + '" stroke-width="1.6"/>';
  const bx = ox + sx * 50 * Math.cos(rad(alpha / 2)), by = oy - sy * 50 * Math.sin(rad(alpha / 2)) + 5;
  s += '<text x="' + bx + '" y="' + by + '" text-anchor="middle" style="fill:' + COLS[1] + '">α</text>';
  s += label(tx + sx * 4 + (sx > 0 ? 12 : -12), ty - sy * 8 + 5, name, sub, COLS[0]);
  return s + '</svg>';
}

/* ---------- A : vecteur ou valeur ---------- */
const CTX = [{ s: 'F', u: 'N', nom: 'force', g: 'f' }, { s: 'v', u: 'm/s', nom: 'vitesse', g: 'f' }, { s: 'E', u: 'V/m', nom: 'champ électrique', g: 'm' }];
const REASONS = [
  'Écriture correcte',
  'Incorrecte : égalité entre un vecteur et un nombre',
  'Incorrecte : une valeur ne peut pas être négative',
  'Incorrecte : flèches retirées, les valeurs ne s\'additionnent pas ainsi',
  'Incorrecte : on ne compare pas des vecteurs avec « &gt; » ou « &lt; »'
];
function genA(level) {
  if (level === 1) {
    const c = pick(CTX);
    const bank = [
      () => qcm('A', 1, 'Un' + (c.g === 'f' ? 'e ' : ' ') + c.nom + ' est modélisé' + (c.g === 'f' ? 'e' : '') + ' par le vecteur ' + V(c.s) + '. Quelles informations ce vecteur donne-t-il ?',
        'L\'origine (point d\'application), la direction, le sens et la valeur', ['Seulement la valeur', 'La direction et la valeur, mais pas le sens', 'Le sens et la valeur, mais pas la direction'],
        'Un vecteur porte <b>quatre informations</b> : origine, direction, sens et valeur. Une simple valeur n\'en donne qu\'une : c\'est pour cela qu\'on ne peut pas écrire un vecteur égal à un nombre.'),
      () => qcm('A', 1, 'La valeur (ou norme) ' + S(c.s) + ' du vecteur ' + V(c.s) + ' est :',
        'un nombre positif ou nul, suivi d\'une unité', ['un nombre qui peut être négatif', 'un vecteur de même sens que ' + V(c.s), 'une direction'],
        'La valeur ' + S(c.s) + ' = ‖' + V(c.s) + '‖ est une longueur : un nombre <b>toujours positif ou nul</b>, avec une unité (ici en ' + c.u + ').'),
      () => qcm('A', 1, 'Comment écrit-on correctement la valeur du vecteur ' + V(c.s) + ' ?',
        S(c.s) + ' = 25 ' + c.u + ' &nbsp;(sans flèche)', [V(c.s) + ' = 25 ' + c.u, V(c.s) + ' = ' + S(c.s) + ' = 25 ' + c.u, '−' + V(c.s) + ' = 25 ' + c.u],
        'La valeur s\'écrit <b>sans flèche</b> : ' + S(c.s) + ' = 25 ' + c.u + '. Écrire ' + V(c.s) + ' = 25 ' + c.u + ' met un vecteur égal à un nombre : c\'est faux.'),
      () => qcm('A', 1, 'Parmi ces grandeurs, laquelle est une grandeur <b>vectorielle</b> ?',
        pick(['la vitesse d\'un mobile', 'le poids d\'un objet', 'le champ électrique entre deux plaques', 'la force exercée par un ressort']),
        shuffle(['la masse d\'un objet', 'l\'énergie cinétique', 'la durée d\'un parcours', 'la température', 'le volume d\'une solution']).slice(0, 3),
        'Une grandeur est vectorielle quand il faut préciser une <b>direction</b> et un <b>sens</b> (forces, vitesses, champs, accélération). Masse, énergie, durée, température, volume sont de simples nombres (grandeurs scalaires).')
    ];
    return pick(bank)();
  }
  if (level === 2) {
    const c = pick(CTX), s = c.s, u = c.u;
    const a = ri(2, 9) * (s === 'E' ? 100 : 1);
    const bank = [
      [V(s) + ' = ' + a + ' ' + u, 1, 'Un vecteur ne peut pas être égal à un nombre. On écrit la valeur sans flèche : ' + S(s) + ' = ' + a + ' ' + u + '.'],
      [S(s) + ' = ' + MINUS + a + ' ' + u, 2, 'Une valeur est toujours positive ou nulle. C\'est le <b>sens</b> du vecteur qui indique « vers la gauche » ou « vers le bas », pas un signe sur la valeur.'],
      [V(s, 1) + ' + ' + V(s, 2) + ' = 0', 1, 'À gauche, une somme de vecteurs ; à droite, le nombre 0. Il faut écrire le <b>vecteur nul</b> : ' + V(s, 1) + ' + ' + V(s, 2) + ' = ' + Z + '.'],
      [V(s, 1) + ' + ' + V(s, 2) + ' = ' + Z, 0, 'Des vecteurs des deux côtés du signe « = », avec le vecteur nul ' + Z + ' : c\'est correct.'],
      [V(s, 1) + ' + ' + V(s, 2) + ' = ' + V(s), 0, 'Une somme de vecteurs égale à un vecteur : c\'est correct.'],
      ['Les vecteurs ' + V(s, 1) + ' et ' + V(s, 2) + ' sont perpendiculaires et ' + V(s) + ' = ' + V(s, 1) + ' + ' + V(s, 2) + '. Un élève écrit : ' + S(s) + ' = ' + S(s, 1) + ' + ' + S(s, 2), 3, 'On a « retiré les flèches ». Pour des vecteurs perpendiculaires, ' + S(s) + ' = √(' + S(s, 1) + '² + ' + S(s, 2) + '²). La relation ' + S(s) + ' = ' + S(s, 1) + ' + ' + S(s, 2) + ' n\'est vraie que pour des vecteurs <b>colinéaires de même sens</b>.'],
      [V(s, 1) + ' &gt; ' + V(s, 2), 4, 'On ne peut pas dire qu\'un vecteur est « plus grand » qu\'un autre. On compare leurs <b>valeurs</b> : ' + S(s, 1) + ' &gt; ' + S(s, 2) + '.'],
      [S(s, 1) + ' &gt; ' + S(s, 2), 0, 'On compare deux valeurs (deux nombres) : c\'est correct.'],
      [V(s, 1) + ' = ' + MINUS + V(s, 2), 0, 'Deux vecteurs opposés : même direction, même valeur, sens contraires. L\'écriture est correcte.'],
      [S(s, 1) + ' = ' + MINUS + S(s, 2), 2, 'Si ' + V(s, 1) + ' = −' + V(s, 2) + ', les deux vecteurs ont la <b>même valeur</b> : ' + S(s, 1) + ' = ' + S(s, 2) + '. Écrire ' + S(s, 1) + ' = −' + S(s, 2) + ' donnerait une valeur négative.'],
      [V(s) + ' = ' + S(s), 1, 'À gauche un vecteur, à droite sa valeur (un nombre) : c\'est impossible. On peut écrire ' + S(s) + ' = ‖' + V(s) + '‖.']
    ];
    const [f, k, expl] = pick(bank);
    const intro = f.indexOf('élève écrit') >= 0 ? f : 'On considère des vecteurs ' + c.nom + '. Cette écriture est-elle correcte ?' + formula(f);
    return qcmFixed('A', 2, intro + (f.indexOf('élève écrit') >= 0 ? ' Cette écriture est-elle correcte ?' : ''), REASONS, k, expl);
  }
  const bank = [
    () => qcm('A', 3, 'Un livre est immobile sur une table, soumis à son poids ' + V('P') + ' et à la réaction ' + V('R') + ' de la table. Quelle écriture est correcte ?',
      V('P') + ' + ' + V('R') + ' = ' + Z, [S('P') + ' + ' + S('R') + ' = 0', V('P') + ' + ' + V('R') + ' = 0', V('P') + ' = ' + V('R')],
      'Principe d\'inertie : ' + V('P') + ' + ' + V('R') + ' = ' + Z + '. « = 0 » sans flèche mélange vecteur et nombre ; ' + S('P') + ' + ' + S('R') + ' = 0 est impossible (deux valeurs positives) ; ' + V('P') + ' = ' + V('R') + ' est faux car les deux vecteurs ont des sens opposés.'),
    () => qcm('A', 3, 'On sait que ' + V('P') + ' + ' + V('R') + ' = ' + Z + '. Quelle relation entre les <b>valeurs</b> est correcte ?',
      S('P') + ' = ' + S('R'), [S('P') + ' + ' + S('R') + ' = 0', S('P') + ' = ' + MINUS + S('R'), V('P') + ' = ' + S('R')],
      V('P') + ' = −' + V('R') + ' : les vecteurs sont opposés, ils ont donc la <b>même valeur</b> : ' + S('P') + ' = ' + S('R') + '. Une valeur n\'est jamais négative.'),
    () => qcm('A', 3, 'Un solide est en équilibre sous l\'action de trois forces non colinéaires : ' + V('F', 1) + ' + ' + V('F', 2) + ' + ' + V('F', 3) + ' = ' + Z + '. Qu\'en déduit-on ?',
      V('F', 3) + ' = ' + MINUS + '(' + V('F', 1) + ' + ' + V('F', 2) + ')', [S('F', 3) + ' = ' + MINUS + '(' + S('F', 1) + ' + ' + S('F', 2) + ')', S('F', 3) + ' = ' + S('F', 1) + ' + ' + S('F', 2), S('F', 1) + ' + ' + S('F', 2) + ' + ' + S('F', 3) + ' = 0'],
      'On reste en écriture vectorielle : ' + V('F', 3) + ' = −(' + V('F', 1) + ' + ' + V('F', 2) + '). Les trois autres réponses « retirent les flèches » : avec des forces non colinéaires, les valeurs ne s\'additionnent pas.'),
    () => qcm('A', 3, 'Laquelle de ces écritures de la deuxième loi de Newton est correcte ?',
      'Σ' + V('F') + ' = m' + V('a'), ['Σ' + V('F') + ' = m' + S('a'), 'Σ' + S('F') + ' = m' + V('a'), 'Σ' + V('F') + ' = ' + V('m') + V('a')],
      'Des vecteurs des deux côtés : Σ' + V('F') + ' = m' + V('a') + ' (la masse m est un nombre). En valeurs, on peut écrire ΣF = m·a.'),
    () => qcm('A', 3, 'Entre deux instants, la vitesse d\'un mobile passe de ' + V('v', 1) + ' à ' + V('v', 2) + ' et Δ' + V('v') + ' = ' + V('v', 2) + ' − ' + V('v', 1) + '. Quelle affirmation est vraie ?',
      'On ne peut écrire Δ' + S('v') + ' = ' + S('v', 2) + ' − ' + S('v', 1) + ' que si les vecteurs sont colinéaires et de même sens', ['Δ' + S('v') + ' = ' + S('v', 2) + ' − ' + S('v', 1) + ' dans tous les cas', 'Δ' + V('v') + ' = ' + S('v', 2) + ' − ' + S('v', 1), 'Si le mobile ralentit, la valeur Δv est négative'],
      'Retirer les flèches n\'est permis que pour des vecteurs colinéaires de même sens. Δ' + V('v') + ' = ' + S('v', 2) + ' − ' + S('v', 1) + ' mélange vecteur et nombres ; et une valeur n\'est jamais négative (c\'est le <b>sens</b> de Δ' + V('v') + ' qui montre le freinage).')
  ];
  return pick(bank)();
}

/* ---------- B : coordonnées et norme ---------- */
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]];
function genB(level) {
  if (level === 1) {
    let dx, dy; do { dx = ri(-5, 5); dy = ri(-4, 4); } while (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy));
    const ask = pick(['x', 'y']), a = ask === 'x' ? dx : dy, other = ask === 'x' ? dy : dx;
    return val('B', 1, 'Sur le quadrillage (1 carreau = 1 unité, axe x vers la droite, axe y vers le haut), quelle est la coordonnée <b>' + ask + '</b> du vecteur ' + V('u') + ' ?' + figGrid([{ x0: 0, y0: 0, dx, dy, name: 'u' }]),
      a, nb(a), '',
      'On compte les carreaux de l\'origine à la pointe : ' + Math.abs(dx) + ' vers la ' + (dx > 0 ? 'droite' : 'gauche') + ' et ' + Math.abs(dy) + ' vers le ' + (dy > 0 ? 'haut' : 'bas') + '. Donc ' + V('u') + coord(nb(dx), nb(dy)) + ' : sa coordonnée ' + ask + ' vaut <b>' + nb(a) + '</b>.',
      { tol: 0, traps: [{ val: other, msg: 'Tu as donné l\'autre coordonnée : x se compte horizontalement, y verticalement.' }], signMsg: 'Le signe est faux : une coordonnée est négative quand le vecteur va vers la gauche (pour x) ou vers le bas (pour y).' });
  }
  if (level === 2) {
    if (Math.random() < 0.5) {
      const xA = nz(-6, 6), yA = nz(-6, 6); let xB, yB; do { xB = ri(-6, 6); yB = ri(-6, 6); } while (xB === xA || yB === yA);
      const ask = pick(['x', 'y']), a = ask === 'x' ? xB - xA : yB - yA, s = ask === 'x' ? xB + xA : yB + yA;
      return val('B', 2, 'On donne A' + coord(nb(xA), nb(yA)) + ' et B' + coord(nb(xB), nb(yB)) + '. Calcule la coordonnée <b>' + ask + '</b> du vecteur ' + V('AB') + '.',
        a, nb(a), '', V('AB') + coord('x<sub>B</sub> − x<sub>A</sub>', 'y<sub>B</sub> − y<sub>A</sub>') + ' : « arrivée moins départ ». Ici ' + ask + ' = ' + nb(ask === 'x' ? xB : yB) + ' − (' + nb(ask === 'x' ? xA : yA) + ') = <b>' + nb(a) + '</b>.',
        { tol: 0, traps: [{ val: s, msg: 'Tu as additionné les coordonnées des points : pour ' + V('AB') + ' on fait « arrivée − départ ».' }], signMsg: 'Attention à l\'ordre : ' + V('AB') + ' a pour coordonnées (x<sub>B</sub> − x<sub>A</sub> ; y<sub>B</sub> − y<sub>A</sub>), et non l\'inverse.' });
    }
    const x = nz(-9, 9), y = nz(-9, 9), c = pick([{ s: 'v', u: 'm/s', n: 'vecteur vitesse' }, { s: 'F', u: 'N', n: 'vecteur force' }]);
    const N = Math.hypot(x, y);
    return val('B', 2, 'Un ' + c.n + ' a pour coordonnées ' + V(c.s) + coord(nb(x, 1), nb(y, 1)) + ' (en ' + c.u + '). Calcule sa valeur ' + S(c.s) + ', arrondie au dixième.',
      N, nb(N, 1), c.u, 'Théorème de Pythagore : ' + S(c.s) + ' = √(' + S(c.s) + '<sub>x</sub>² + ' + S(c.s) + '<sub>y</sub>²) = √(' + nb(x, 1) + '² + ' + nb(y, 1) + '²) = √' + (x * x + y * y) + ' ≈ <b>' + nb(N, 1) + ' ' + c.u + '</b>. Une valeur est toujours positive, même si une coordonnée est négative.',
      { tol: 0.051, traps: [{ val: Math.abs(x) + Math.abs(y), msg: 'Tu as additionné les coordonnées : la valeur d\'un vecteur se calcule avec Pythagore, √(x² + y²).' }, { val: x + y, msg: 'Tu as additionné les coordonnées : la valeur se calcule avec √(x² + y²).' }, { val: x * x + y * y, msg: 'Tu as oublié la racine carrée : ' + S(c.s) + ' = √(x² + y²).' }], signMsg: 'Une valeur (norme) n\'est jamais négative.' });
  }
  const [a, b, n] = pick(TRIPLES), k = pick([1, 1, 2]), sy = sgn(), sx = sgn();
  const Fx = sx * a * k, Fy = sy * b * k, F = n * k;
  return val('B', 3, 'Une force ' + V('F') + ' a pour valeur ' + S('F') + ' = ' + F + ' N. Sa coordonnée horizontale est ' + S('F') + '<sub>x</sub> = ' + nb(Fx) + ' N et le vecteur est orienté vers le <b>' + (sy > 0 ? 'haut' : 'bas') + '</b>. Calcule sa coordonnée verticale ' + S('F') + '<sub>y</sub> (avec son signe).',
    Fy, nb(Fy), 'N', S('F') + '² = ' + S('F') + '<sub>x</sub>² + ' + S('F') + '<sub>y</sub>², donc |' + S('F') + '<sub>y</sub>| = √(' + F + '² − ' + Math.abs(Fx) + '²) = ' + Math.abs(Fy) + ' N. Le vecteur va vers le ' + (sy > 0 ? 'haut : ' + S('F') + '<sub>y</sub> = <b>' + nb(Fy) + ' N</b>' : 'bas : la coordonnée est négative, ' + S('F') + '<sub>y</sub> = <b>' + nb(Fy) + ' N</b>') + '.',
    { tol: 0.051, traps: [{ val: sy * (F - Math.abs(Fx)), msg: 'La valeur n\'est pas la somme des coordonnées : utilise ' + S('F') + '² = ' + S('F') + '<sub>x</sub>² + ' + S('F') + '<sub>y</sub>².' }, { val: -sy * (F - Math.abs(Fx)), msg: 'La valeur n\'est pas la somme des coordonnées : utilise ' + S('F') + '² = ' + S('F') + '<sub>x</sub>² + ' + S('F') + '<sub>y</sub>².' }], signMsg: 'La valeur absolue est bonne, mais regarde le sens : vers le haut → coordonnée positive, vers le bas → négative.' });
}

/* ---------- C : somme ---------- */
function genC(level) {
  if (level === 1) {
    let a, b, c, d; do { a = ri(-5, 5); b = ri(-4, 4); c = ri(-5, 5); d = ri(-4, 4); } while (!a || !b || !c || !d || a + c === 0 || b + d === 0 || a + c === b + d);
    const ask = pick(['x', 'y']), r = ask === 'x' ? a + c : b + d, wrong = ask === 'x' ? b + d : a + c;
    const withFig = Math.random() < 0.5;
    const html = withFig
      ? 'Sur le quadrillage (1 carreau = 1 unité, x vers la droite, y vers le haut), on a tracé ' + V('u') + ' et ' + V('v') + '. Quelle est la coordonnée <b>' + ask + '</b> du vecteur ' + V('w') + ' = ' + V('u') + ' + ' + V('v') + ' ?' + figGrid([{ x0: 0, y0: 0, dx: a, dy: b, name: 'u' }, { x0: a >= 0 ? -2 : 2, y0: b >= 0 ? Math.max(b, 0) + 2 : Math.min(b, 0) - 2, dx: c, dy: d, name: 'v', c: 1 }].map(v => v))
      : 'On donne ' + V('u') + coord(nb(a), nb(b)) + ' et ' + V('v') + coord(nb(c), nb(d)) + '. Quelle est la coordonnée <b>' + ask + '</b> du vecteur ' + V('w') + ' = ' + V('u') + ' + ' + V('v') + ' ?';
    return val('C', 1, html, r, nb(r), '', 'Les coordonnées s\'additionnent : ' + V('w') + coord(nb(a) + ' + (' + nb(c) + ')', nb(b) + ' + (' + nb(d) + ')') + ' = ' + coord(nb(a + c), nb(b + d)) + '. Coordonnée ' + ask + ' : <b>' + nb(r) + '</b>.',
      { tol: 0, traps: [{ val: wrong, msg: 'Tu as donné l\'autre coordonnée.' }] });
  }
  if (level === 2) {
    const type = pick(['perp', 'perp', 'oppose', 'meme', 'riviere']);
    if (type === 'riviere') {
      const v1 = ri(4, 12), v2 = ri(2, 7), v = Math.hypot(v1, v2);
      return val('C', 2, 'Une barque traverse une rivière en se dirigeant perpendiculairement à la berge à <b>v<sub>1</sub> = ' + v1 + ' km/h</b> (vitesse par rapport à l\'eau). Le courant, parallèle à la berge, a une vitesse <b>v<sub>2</sub> = ' + v2 + ' km/h</b>. La vitesse de la barque par rapport à la berge est ' + V('v') + ' = ' + V('v', 1) + ' + ' + V('v', 2) + '. Calcule sa valeur v, arrondie au dixième.',
        v, nb(v, 1), 'km/h', V('v', 1) + ' et ' + V('v', 2) + ' sont <b>perpendiculaires</b> : v = √(v<sub>1</sub>² + v<sub>2</sub>²) = √(' + v1 + '² + ' + v2 + '²) ≈ <b>' + nb(v, 1) + ' km/h</b>.',
        { tol: 0.051, traps: [{ val: v1 + v2, msg: 'Tu as « retiré les flèches » : v = v<sub>1</sub> + v<sub>2</sub> n\'est vrai que pour des vecteurs colinéaires de même sens. Ici ils sont perpendiculaires : Pythagore.' }, { val: Math.abs(v1 - v2), msg: 'Les vecteurs ne sont pas colinéaires : on utilise Pythagore, pas une différence de valeurs.' }] });
    }
    const F1 = ri(3, 40), F2 = ri(3, 40);
    const desc = { perp: 'perpendiculaires', oppose: 'de même direction mais de <b>sens opposés</b>', meme: 'de même direction et de <b>même sens</b>' }[type];
    const F = type === 'perp' ? Math.hypot(F1, F2) : type === 'oppose' ? Math.abs(F1 - F2) : F1 + F2;
    if (type === 'oppose' && F1 === F2) return genC(2);
    const traps = [];
    if (type !== 'meme') traps.push({ val: F1 + F2, msg: 'Tu as additionné les valeurs (flèches retirées) : ce n\'est vrai que pour des forces colinéaires de même sens.' });
    if (type === 'perp') traps.push({ val: Math.abs(F1 - F2), msg: 'Forces perpendiculaires : on utilise Pythagore, √(F<sub>1</sub>² + F<sub>2</sub>²).' });
    if (type === 'perp') traps.push({ val: F1 * F1 + F2 * F2, msg: 'Tu as oublié la racine carrée.' });
    return val('C', 2, 'Deux forces ' + V('F', 1) + ' et ' + V('F', 2) + ', ' + desc + ', s\'exercent sur un objet : ' + S('F', 1) + ' = ' + F1 + ' N et ' + S('F', 2) + ' = ' + F2 + ' N. Calcule la valeur de ' + V('F') + ' = ' + V('F', 1) + ' + ' + V('F', 2) + (type === 'perp' ? ', arrondie au dixième' : '') + '.',
      F, nb(F, type === 'perp' ? 1 : 0), 'N',
      type === 'perp' ? 'Forces perpendiculaires : on place les vecteurs bout à bout, ils forment un triangle rectangle. ' + S('F') + ' = √(' + F1 + '² + ' + F2 + '²) ≈ <b>' + nb(F, 1) + ' N</b>.'
        : type === 'oppose' ? 'Même direction, sens opposés : les forces se retranchent. ' + S('F') + ' = |' + F1 + ' − ' + F2 + '| = <b>' + F + ' N</b>, dans le sens de la plus grande.'
          : 'Même direction et même sens : c\'est le seul cas où les valeurs s\'additionnent. ' + S('F') + ' = ' + F1 + ' + ' + F2 + ' = <b>' + F + ' N</b>.',
      { tol: 0.051, traps, signMsg: 'Une valeur est toujours positive.' });
  }
  if (Math.random() < 0.5) {
    let x1, y1, x2, y2; do { x1 = nz(-8, 8); y1 = nz(-8, 8); x2 = nz(-8, 8); y2 = nz(-8, 8); } while (x1 + x2 === 0 || y1 + y2 === 0);
    const ask = pick(['x', 'y']), r = ask === 'x' ? -(x1 + x2) : -(y1 + y2);
    return val('C', 3, 'Un objet immobile est soumis à trois forces : ' + V('F', 1) + coord(nb(x1), nb(y1)) + ', ' + V('F', 2) + coord(nb(x2), nb(y2)) + ' (en N) et ' + V('F', 3) + '. Calcule la coordonnée <b>' + ask + '</b> de ' + V('F', 3) + '.',
      r, nb(r), 'N', 'L\'objet est immobile : ' + V('F', 1) + ' + ' + V('F', 2) + ' + ' + V('F', 3) + ' = ' + Z + ', donc ' + V('F', 3) + ' = −(' + V('F', 1) + ' + ' + V('F', 2) + '). Coordonnée ' + ask + ' : −(' + nb(ask === 'x' ? x1 : y1) + ' + (' + nb(ask === 'x' ? x2 : y2) + ')) = <b>' + nb(r) + ' N</b>.',
      { tol: 0, signMsg: 'Il manque le signe « − » : ' + V('F', 3) + ' = −(' + V('F', 1) + ' + ' + V('F', 2) + ') pour que la somme des trois forces soit nulle.' });
  }
  const F1 = ri(3, 30), F2 = ri(3, 30), F3 = Math.hypot(F1, F2);
  return val('C', 3, 'Un anneau est en équilibre sous l\'action de trois forces. ' + V('F', 1) + ' (' + F1 + ' N) et ' + V('F', 2) + ' (' + F2 + ' N) sont perpendiculaires. Calcule la valeur de la troisième force ' + V('F', 3) + ', arrondie au dixième.',
    F3, nb(F3, 1), 'N', 'Équilibre : ' + V('F', 3) + ' = −(' + V('F', 1) + ' + ' + V('F', 2) + '). Sa valeur est celle de ' + V('F', 1) + ' + ' + V('F', 2) + ' : √(' + F1 + '² + ' + F2 + '²) ≈ <b>' + nb(F3, 1) + ' N</b>.',
    { tol: 0.051, traps: [{ val: F1 + F2, msg: 'Tu as additionné les valeurs (flèches retirées) : les forces sont perpendiculaires, il faut Pythagore.' }, { val: -F3, msg: 'Une valeur n\'est jamais négative : le signe − concerne le vecteur ' + V('F', 3) + ' = −(' + V('F', 1) + ' + ' + V('F', 2) + '), pas sa valeur.' }] });
}

/* ---------- D : différence, variation de vitesse ---------- */
function genD(level) {
  if (level === 1) {
    if (Math.random() < 0.35) {
      return qcm('D', 1, 'Par rapport au vecteur ' + V('v') + ', le vecteur ' + MINUS + V('v') + ' a :',
        'la même direction, la même valeur, un sens opposé', ['la même direction, le même sens, une valeur négative', 'une direction perpendiculaire, la même valeur', 'la même direction, un sens opposé, une valeur négative'],
        MINUS + V('v') + ' est l\'<b>opposé</b> de ' + V('v') + ' : même direction, même valeur (positive !), sens contraire. On s\'en sert pour soustraire : ' + V('v', 2) + ' − ' + V('v', 1) + ' = ' + V('v', 2) + ' + (−' + V('v', 1) + ').');
    }
    let a, b, c, d; do { a = ri(-5, 5); b = ri(-4, 4); c = ri(-5, 5); d = ri(-4, 4); } while (!a || !b || !c || !d || c - a === 0 || d - b === 0 || c + a === c - a || d + b === d - b);
    const ask = pick(['x', 'y']), r = ask === 'x' ? c - a : d - b, add = ask === 'x' ? c + a : d + b;
    return val('D', 1, 'Les vitesses d\'un mobile à deux instants sont ' + V('v', 1) + coord(nb(a), nb(b)) + ' et ' + V('v', 2) + coord(nb(c), nb(d)) + ' (en m/s). Calcule la coordonnée <b>' + ask + '</b> du vecteur variation de vitesse Δ' + V('v') + ' = ' + V('v', 2) + ' − ' + V('v', 1) + '.',
      r, nb(r), 'm/s', 'Coordonnées de Δ' + V('v') + ' : « arrivée − départ », (' + nb(c) + ' − (' + nb(a) + ') ; ' + nb(d) + ' − (' + nb(b) + ')) = ' + coord(nb(c - a), nb(d - b)) + '. Coordonnée ' + ask + ' : <b>' + nb(r) + ' m/s</b>.',
      { tol: 0, traps: [{ val: add, msg: 'Tu as additionné : Δ' + V('v') + ' est une <b>différence</b>, ' + V('v', 2) + ' − ' + V('v', 1) + '.' }], signMsg: 'Tu as calculé ' + V('v', 1) + ' − ' + V('v', 2) + ' : Δ' + V('v') + ' = ' + V('v', 2) + ' − ' + V('v', 1) + ' (la vitesse finale moins la vitesse initiale).' });
  }
  if (level === 2) {
    const acc = Math.random() < 0.5;
    let v1 = ri(10, 45), v2 = acc ? v1 + ri(2, 15) : v1 - ri(2, Math.min(15, v1 - 2));
    const dv = Math.abs(v2 - v1);
    if (Math.random() < 0.4) {
      return qcm('D', 2, 'Sur une piste rectiligne, une voiture passe de ' + S('v', 1) + ' = ' + v1 + ' m/s à ' + S('v', 2) + ' = ' + v2 + ' m/s. Que peut-on dire du vecteur Δ' + V('v') + ' = ' + V('v', 2) + ' − ' + V('v', 1) + ' ?',
        acc ? 'Il a le même sens que le mouvement et sa valeur est ' + dv + ' m/s' : 'Il est de sens opposé au mouvement et sa valeur est ' + dv + ' m/s',
        [acc ? 'Il est de sens opposé au mouvement et sa valeur est ' + dv + ' m/s' : 'Il a le même sens que le mouvement et sa valeur est ' + dv + ' m/s', acc ? 'Il a le même sens que le mouvement et sa valeur est ' + (v1 + v2) + ' m/s' : 'Il a le même sens que le mouvement et sa valeur est ' + MINUS + dv + ' m/s', 'Il est nul car le mouvement est rectiligne'],
        'Mouvement rectiligne : les vecteurs vitesse sont colinéaires et de même sens, donc Δv = |' + v2 + ' − ' + v1 + '| = ' + dv + ' m/s. ' + (acc ? 'La voiture accélère : Δ' + V('v') + ' a le <b>sens du mouvement</b>.' : 'La voiture freine : Δ' + V('v') + ' est de <b>sens opposé au mouvement</b>. Sa valeur reste positive.'));
    }
    return val('D', 2, 'Une voiture roule en ligne droite. Sa vitesse passe de ' + S('v', 1) + ' = ' + v1 + ' m/s à ' + S('v', 2) + ' = ' + v2 + ' m/s. Calcule la <b>valeur</b> Δv du vecteur variation de vitesse.',
      dv, String(dv), 'm/s', 'En ligne droite, ' + V('v', 1) + ' et ' + V('v', 2) + ' sont colinéaires et de même sens : on peut travailler avec les valeurs. Δv = |' + v2 + ' − ' + v1 + '| = <b>' + dv + ' m/s</b>. ' + (acc ? 'Δ' + V('v') + ' a le sens du mouvement (accélération).' : 'Δ' + V('v') + ' est de sens opposé au mouvement (freinage).'),
      { tol: 0.01, traps: [{ val: v1 + v2, msg: 'Tu as additionné les vitesses : Δ' + V('v') + ' est une différence, ' + V('v', 2) + ' − ' + V('v', 1) + '.' }], signMsg: 'Une valeur est toujours positive : Δv = ' + dv + ' m/s. C\'est le <b>sens</b> de Δ' + V('v') + ' (opposé au mouvement) qui indique le freinage.' });
  }
  const v1 = ri(10, 45), v2 = Math.random() < 0.35 ? v1 : ri(10, 45), dv = Math.hypot(v1, v2);
  const traps = [{ val: Math.abs(v2 - v1), msg: v1 === v2 ? 'La valeur de la vitesse ne change pas, mais sa <b>direction</b> change : Δ' + V('v') + ' n\'est pas nul. Les vecteurs sont perpendiculaires : Pythagore.' : 'Tu as soustrait les valeurs (flèches retirées) : c\'est faux quand les vecteurs ne sont pas colinéaires. Ici ils sont perpendiculaires : Pythagore.' }, { val: v1 + v2, msg: 'Tu as additionné les valeurs : pour des vecteurs perpendiculaires, Δv = √(v<sub>1</sub>² + v<sub>2</sub>²).' }];
  return val('D', 3, 'Dans un virage, une voiture roule à ' + S('v', 1) + ' = ' + v1 + ' m/s vers l\'est, puis à ' + S('v', 2) + ' = ' + v2 + ' m/s vers le nord. Calcule la valeur de Δ' + V('v') + ' = ' + V('v', 2) + ' − ' + V('v', 1) + ', arrondie au dixième.' + figGrid([{ x0: 0, y0: 0, dx: 4, dy: 0, name: 'v', sub: 1 }, { x0: 7, y0: 0, dx: 0, dy: Math.min(6, Math.max(2, Math.round(4 * v2 / v1))), name: 'v', sub: 2, c: 1 }]) + '<p class="muted" style="font-size:.85rem">Schéma sans échelle.</p>',
    dv, nb(dv, 1), 'm/s', V('v', 2) + ' et −' + V('v', 1) + ' sont perpendiculaires : Δv = √(v<sub>2</sub>² + v<sub>1</sub>²) = √(' + v2 + '² + ' + v1 + '²) ≈ <b>' + nb(dv, 1) + ' m/s</b>.' + (v1 === v2 ? ' La valeur de la vitesse n\'a pas changé, et pourtant Δ' + V('v') + ' n\'est pas nul : la direction a changé.' : ''),
    { tol: 0.051, traps });
}

/* ---------- E : vecteur × nombre ---------- */
const PART = [['un électron', -1, '−e'], ['un proton', 1, '+e'], ['un ion chlorure Cl<sup>−</sup>', -1, '−e'], ['un ion sodium Na<sup>+</sup>', 1, '+e'], ['un ion cuivre Cu<sup>2+</sup>', 2, '+2e'], ['un ion sulfure S<sup>2−</sup>', -2, '−2e']];
function genE(level) {
  if (level === 1) {
    if (Math.random() < 0.7) {
      const [nom, z, qs] = pick(PART);
      return qcmFixed('E', 1, 'Placé dans un champ électrique ' + V('E') + ', ' + nom + ' (charge q = ' + qs + ') subit la force ' + V('F') + ' = q' + V('E') + '. Comment sont les vecteurs ' + V('F') + ' et ' + V('E') + ' ?',
        ['même direction, même sens', 'même direction, sens opposés', 'directions perpendiculaires', 'on ne peut pas savoir'], z > 0 ? 0 : 1,
        'D\'après l\'expression vectorielle ' + V('F') + ' = q' + V('E') + ', les vecteurs ' + V('F') + ' et ' + V('E') + ' ont la même direction et ' + (z > 0 ? '<b>le même sens</b> car q &gt; 0.' : '<b>des sens opposés</b> car q &lt; 0.'));
    }
    const k = pick([-3, -2, -0.5, 2, 3, 0.5]), u = ri(2, 8);
    return qcm('E', 1, 'On définit ' + V('w') + ' = ' + nb(k, k % 1 ? 1 : 0) + ' ' + V('u') + ', avec u = ' + u + ' N. Quelle description de ' + V('w') + ' est correcte ?',
      'Même direction que ' + V('u') + ', ' + (k > 0 ? 'même sens' : 'sens opposé') + ', valeur ' + nb(Math.abs(k) * u, 1) + ' N',
      ['Même direction que ' + V('u') + ', ' + (k > 0 ? 'sens opposé' : 'même sens') + ', valeur ' + nb(Math.abs(k) * u, 1) + ' N', 'Même direction que ' + V('u') + ', ' + (k > 0 ? 'même sens' : 'sens opposé') + ', valeur ' + nb(k * u + (k > 0 ? u : 0), 1) + ' N', 'Direction perpendiculaire à ' + V('u') + ', valeur ' + nb(Math.abs(k) * u, 1) + ' N'],
      'k·' + V('u') + ' a la même direction que ' + V('u') + ', ' + (k > 0 ? 'le même sens (k &gt; 0)' : 'le sens opposé (k &lt; 0)') + ' et la valeur |k| × u = ' + nb(Math.abs(k), 1) + ' × ' + u + ' = <b>' + nb(Math.abs(k) * u, 1) + ' N</b> (jamais négative).');
  }
  if (level === 2) {
    if (Math.random() < 0.55) {
      const [nom, z, qs] = pick(PART);
      const Em = ri(10, 99) / 10, Ep = ri(3, 5), E = Em * Math.pow(10, Ep), F = Math.abs(z) * 1.602e-19 * E;
      return val('E', 2, nom.charAt(0).toUpperCase() + nom.slice(1) + ' (q = ' + qs + ', avec e = 1,602×10<sup>' + MINUS + '19</sup> C) est placé dans un champ électrique de valeur E = ' + nb(Em, 1) + '×10<sup>' + Ep + '</sup> V/m. Calcule la valeur F de la force ' + V('F') + ' = q' + V('E') + ' (2 chiffres significatifs).',
        F, sig(F, 2), 'N', 'En valeurs : F = |q| × E = ' + Math.abs(z) + ' × 1,602×10<sup>' + MINUS + '19</sup> × ' + nb(Em, 1) + '×10<sup>' + Ep + '</sup> ≈ <b>' + sig(F, 2) + ' N</b>. Le signe de q ne sert qu\'à trouver le <b>sens</b> de ' + V('F') + '.',
        { tol: sigTol(F, 2), signMsg: 'Une valeur est toujours positive : F = |q| × E. Le signe de q indique le sens de ' + V('F') + ', pas sa valeur.', helper: 'Écris seulement le nombre (sans l\'unité), par exemple 3,2×10^-15.' });
    }
    const m = ri(5, 95) / 10, P = m * 9.81;
    return val('E', 2, 'Le poids d\'un objet s\'écrit ' + V('P') + ' = m' + V('g') + '. Calcule la valeur P du poids pour m = ' + nb(m, 1) + ' kg et g = 9,81 N/kg (3 chiffres significatifs).',
      P, sig(P, 3), 'N', 'En valeurs : P = m × g = ' + nb(m, 1) + ' × 9,81 ≈ <b>' + sig(P, 3) + ' N</b>. Comme m &gt; 0, ' + V('P') + ' et ' + V('g') + ' ont même direction et même sens (vertical, vers le bas).',
      { tol: sigTol(P, 3), traps: [{ val: m, msg: 'Tu as donné la masse : le poids est P = m × g.' }], signMsg: 'Une valeur est toujours positive : « vers le bas » est donné par le sens de ' + V('P') + ', pas par un signe.' });
  }
  if (Math.random() < 0.4) {
    return qcm('E', 3, 'D\'après la deuxième loi de Newton (approchée), Σ' + V('F') + ' = m × Δ' + V('v') + ' / Δt. Que peut-on dire de Σ' + V('F') + ' et Δ' + V('v') + ' ?',
      'Ils ont la même direction et le même sens', ['Ils ont des sens opposés', 'Ils sont perpendiculaires', 'Ils ont la même valeur'],
      'm et Δt sont des nombres positifs : Σ' + V('F') + ' = (m/Δt) × Δ' + V('v') + ' est le produit de Δ' + V('v') + ' par un nombre positif, donc <b>même direction et même sens</b>. Leurs valeurs sont différentes (et n\'ont pas la même unité).');
  }
  const m = pick([0.17, 0.43, 0.058, 0.6, 1.2]), dv = ri(5, 40) / 10, dt = pick([0.04, 0.05, 0.1, 0.2]), F = m * dv / dt;
  return val('E', 3, 'Un ballon de masse m = ' + nb(m, String(m).split('.')[1].length) + ' kg voit sa vitesse varier de Δv = ' + nb(dv, 1) + ' m/s pendant Δt = ' + nb(dt, 2) + ' s. Avec Σ' + V('F') + ' = m × Δ' + V('v') + ' / Δt, calcule la valeur de la somme des forces (2 chiffres significatifs).',
    F, sig(F, 2), 'N', 'En valeurs : ΣF = m × Δv / Δt = ' + nb(m, String(m).split('.')[1].length) + ' × ' + nb(dv, 1) + ' / ' + nb(dt, 2) + ' ≈ <b>' + sig(F, 2) + ' N</b>. Σ' + V('F') + ' a le même sens que Δ' + V('v') + '.',
    { tol: sigTol(F, 2), traps: [{ val: m * dv, msg: 'Tu as oublié de diviser par Δt.' }, { val: m * dv * dt, msg: 'Il faut diviser par Δt, pas multiplier.' }] });
}

/* ---------- F : projection ---------- */
const ANG = [20, 25, 30, 35, 40, 50, 55, 60, 65, 70];
function genF(level) {
  if (level === 1) {
    const a = pick(ANG), F = ri(10, 90), ask = pick(['x', 'y']);
    const fx = F * Math.cos(rad(a)), fy = F * Math.sin(rad(a)), r = ask === 'x' ? fx : fy, o = ask === 'x' ? fy : fx;
    return val('F', 1, 'La force ' + V('F') + ', de valeur ' + S('F') + ' = ' + F + ' N, fait un angle α = ' + a + '° avec l\'axe x. Calcule sa coordonnée ' + S('F') + '<sub>' + ask + '</sub> (3 chiffres significatifs).' + figAngle(a, 1, 1, 'F'),
      r, sig(r, 3), 'N', 'Dans le triangle rectangle, ' + (ask === 'x' ? 'la projection sur x est le côté <b>adjacent</b> à α : ' + S('F') + '<sub>x</sub> = ' + S('F') + ' cos α = ' + F + ' × cos ' + a + '°' : 'la projection sur y est le côté <b>opposé</b> à α : ' + S('F') + '<sub>y</sub> = ' + S('F') + ' sin α = ' + F + ' × sin ' + a + '°') + ' ≈ <b>' + sig(r, 3) + ' N</b>.',
      { tol: sigTol(r, 3), traps: [{ val: o, msg: 'Tu as confondu cos et sin : côté adjacent à l\'angle → cos, côté opposé → sin.' }, { val: F, msg: 'La coordonnée n\'est pas la valeur de la force : il faut projeter (cos ou sin).' }, { val: F * Math.cos(a), msg: 'Ta calculatrice est en radians : passe-la en degrés.' }, { val: F * Math.sin(a), msg: 'Ta calculatrice est en radians : passe-la en degrés.' }] });
  }
  if (level === 2) {
    if (Math.random() < 0.3) {
      const m = ri(2, 30) / 10, P = m * 9.81;
      return val('F', 2, 'Un objet de masse m = ' + nb(m, 1) + ' kg est soumis à son poids ' + V('P') + ' (g = 9,81 N/kg). Le repère a un axe x horizontal et un axe y <b>vertical vers le haut</b>. Calcule la coordonnée P<sub>y</sub> (3 chiffres significatifs, avec son signe).',
        -P, sig(-P, 3), 'N', V('P') + ' est vertical vers le bas, donc dans le sens contraire de l\'axe y : P<sub>y</sub> = −m g = −' + nb(m, 1) + ' × 9,81 ≈ <b>' + sig(-P, 3) + ' N</b> (et P<sub>x</sub> = 0). La <b>valeur</b> P reste positive ; c\'est la <b>coordonnée</b> qui est négative.',
        { tol: sigTol(P, 3), signMsg: 'Le poids est dirigé vers le bas, contre l\'axe y : sa coordonnée P<sub>y</sub> est <b>négative</b>. (Une coordonnée peut être négative, une valeur jamais.)' });
    }
    const a = pick(ANG), F = ri(10, 90), sx = sgn(), sy = sx > 0 ? -1 : sgn(), ask = pick(['x', 'y']);
    const fx = sx * F * Math.cos(rad(a)), fy = sy * F * Math.sin(rad(a)), r = ask === 'x' ? fx : fy;
    const dirTxt = (ask === 'x' ? (sx > 0 ? 'vers la droite' : 'vers la gauche') : (sy > 0 ? 'vers le haut' : 'vers le bas'));
    return val('F', 2, 'La force ' + V('F') + ' (' + S('F') + ' = ' + F + ' N) fait un angle α = ' + a + '° avec l\'axe horizontal. Calcule sa coordonnée ' + S('F') + '<sub>' + ask + '</sub> avec son signe (3 chiffres significatifs).' + figAngle(a, sx, sy, 'F'),
      r, sig(r, 3), 'N', (ask === 'x' ? '|' + S('F') + '<sub>x</sub>| = ' + S('F') + ' cos α' : '|' + S('F') + '<sub>y</sub>| = ' + S('F') + ' sin α') + ' = ' + sig(Math.abs(r), 3) + ' N. Le vecteur pointe ' + dirTxt + ' : la coordonnée est ' + (r < 0 ? '<b>négative</b>' : 'positive') + ', ' + S('F') + '<sub>' + ask + '</sub> = <b>' + sig(r, 3) + ' N</b>.',
      { tol: sigTol(r, 3), traps: [{ val: ask === 'x' ? fy : fx, msg: 'Tu as confondu cos et sin : l\'angle α est mesuré à partir de l\'axe horizontal.' }, { val: -(ask === 'x' ? fy : fx), msg: 'Tu as confondu cos et sin : l\'angle α est mesuré à partir de l\'axe horizontal.' }], signMsg: 'La valeur absolue est bonne, mais le vecteur pointe ' + dirTxt + ' : regarde le sens de l\'axe pour choisir le signe.' });
  }
  const m = ri(5, 50) / 10, a = pick([15, 20, 25, 30, 35, 40]), P = m * 9.81, ask = pick(['f', 'R', 'Px']);
  const tgt = { f: P * Math.sin(rad(a)), R: P * Math.cos(rad(a)), Px: P * Math.sin(rad(a)) }[ask], other = { f: P * Math.cos(rad(a)), R: P * Math.sin(rad(a)), Px: P * Math.cos(rad(a)) }[ask];
  const q = { f: 'la valeur f de la force de frottement ' + V('f') + ' (parallèle à la pente)', R: 'la valeur R de la réaction normale ' + V('R') + ' (perpendiculaire à la pente)', Px: 'la coordonnée P<sub>x</sub> du poids sur l\'axe x (parallèle à la pente, orienté vers le bas de la pente)' }[ask];
  return val('F', 3, 'Une caisse de masse m = ' + nb(m, 1) + ' kg est immobile sur un plan incliné d\'un angle α = ' + a + '° par rapport à l\'horizontale (g = 9,81 N/kg). On choisit un axe x parallèle à la pente (vers le bas) et un axe y perpendiculaire à la pente. Calcule ' + q + ' (3 chiffres significatifs).',
    tgt, sig(tgt, 3), 'N', 'L\'angle entre ' + V('P') + ' et l\'axe y est égal à α. Projection : P<sub>x</sub> = m g sin α = ' + sig(P * Math.sin(rad(a)), 3) + ' N et P<sub>y</sub> = −m g cos α = ' + sig(-P * Math.cos(rad(a)), 3) + ' N. ' + (ask === 'Px' ? 'Donc <b>P<sub>x</sub> = ' + sig(tgt, 3) + ' N</b>.' : 'Équilibre : ' + V('P') + ' + ' + V('R') + ' + ' + V('f') + ' = ' + Z + ', on projette : ' + (ask === 'f' ? 'sur x, P<sub>x</sub> − f = 0, donc <b>f = m g sin α ≈ ' + sig(tgt, 3) + ' N</b>.' : 'sur y, R − m g cos α = 0, donc <b>R = m g cos α ≈ ' + sig(tgt, 3) + ' N</b>.')),
    { tol: sigTol(tgt, 3), traps: [{ val: other, msg: 'Tu as confondu cos et sin : dans le plan incliné, la composante parallèle à la pente est m g sin α, la composante perpendiculaire est m g cos α.' }, { val: P, msg: 'Il faut projeter le poids : la valeur cherchée n\'est pas m g mais une de ses composantes.' }], signMsg: ask === 'Px' ? 'L\'axe x est orienté vers le bas de la pente, comme la composante du poids : P<sub>x</sub> est positive.' : 'Une valeur est toujours positive.' });
}

/* ---------- G : produit scalaire ---------- */
function genG(level) {
  if (level === 1) {
    if (Math.random() < 0.35) {
      return qcm('G', 1, 'Le produit scalaire ' + V('u') + '·' + V('v') + ' de deux vecteurs est :',
        'un nombre, qui peut être négatif', ['un vecteur', 'un nombre toujours positif', 'un vecteur perpendiculaire à ' + V('u') + ' et ' + V('v')],
        'Le produit scalaire est un <b>nombre</b> : ' + V('u') + '·' + V('v') + ' = u × v × cos θ. Il est négatif quand l\'angle θ dépasse 90°. On n\'écrit donc jamais ' + V('u') + '·' + V('v') + ' = ' + V('w') + '.');
    }
    let a, b, c, d; do { a = nz(-6, 6); b = nz(-6, 6); c = nz(-6, 6); d = nz(-6, 6); } while (a * c + b * d === 0 || a * c + b * d === a * c);
    const p = a * c + b * d;
    return val('G', 1, 'Calcule le produit scalaire ' + V('u') + '·' + V('v') + ' avec ' + V('u') + coord(nb(a), nb(b)) + ' et ' + V('v') + coord(nb(c), nb(d)) + '.',
      p, nb(p), '', 'En coordonnées : ' + V('u') + '·' + V('v') + ' = x x\' + y y\' = ' + nb(a) + ' × (' + nb(c) + ') + ' + nb(b) + ' × (' + nb(d) + ') = <b>' + nb(p) + '</b>. C\'est un nombre, qui peut être négatif.',
      { tol: 0, traps: [{ val: a * c, msg: 'Il manque le terme y y\' : ' + V('u') + '·' + V('v') + ' = x x\' + y y\'.' }, { val: (a + c) * (b + d), msg: 'On multiplie les coordonnées de même nom puis on additionne : x x\' + y y\'.' }, { val: a * c - b * d, msg: 'C\'est une somme : x x\' <b>+</b> y y\'.' }], signMsg: 'Attention aux signes dans les produits (moins par moins donne plus).' });
  }
  if (level === 2) {
    const F = ri(10, 90) * pick([1, 10]), d = ri(2, 50), a = pick([0, 20, 30, 40, 45, 60]), W = F * d * Math.cos(rad(a));
    return val('G', 2, 'Un enfant tire une luge avec une force ' + V('F') + ' constante (' + S('F') + ' = ' + F + ' N) faisant un angle α = ' + a + '° avec le déplacement AB = ' + d + ' m. Calcule le travail W<sub>AB</sub>(' + V('F') + ') = ' + V('F') + '·' + V('AB') + ' (3 chiffres significatifs).',
      W, sig(W, 3), 'J', 'W<sub>AB</sub>(' + V('F') + ') = ' + S('F') + ' × AB × cos α = ' + F + ' × ' + d + ' × cos ' + a + '° ≈ <b>' + sig(W, 3) + ' J</b>. Seule la composante de ' + V('F') + ' le long du déplacement travaille.',
      { tol: sigTol(W, 3), traps: a ? [{ val: F * d, msg: 'Tu as oublié cos α : seule la composante de la force selon le déplacement travaille.' }, { val: F * d * Math.sin(rad(a)), msg: 'C\'est cos α, pas sin α : on projette la force sur la direction du déplacement.' }, { val: F * d * Math.cos(a), msg: 'Ta calculatrice est en radians : passe-la en degrés.' }] : [] });
  }
  if (Math.random() < 0.4) {
    const sit = pick([
      ['le poids d\'un randonneur qui <b>monte</b> une côte', 1, 'Le poids est vertical vers le bas, le déplacement monte : l\'angle dépasse 90°, le travail est <b>résistant</b> (négatif).'],
      ['le poids d\'un skieur qui <b>descend</b> une piste', 0, 'Le poids (vers le bas) et le déplacement (qui descend) font un angle inférieur à 90° : travail <b>moteur</b> (positif).'],
      ['la réaction normale ' + V('R') + ' d\'une table horizontale sur un objet qui glisse', 2, V('R') + ' est perpendiculaire au déplacement : cos 90° = 0, le travail est <b>nul</b>.'],
      ['la force de frottement sur un palet qui glisse', 1, 'Les frottements s\'opposent au déplacement (angle de 180°) : travail <b>résistant</b>, W = −f × AB.'],
      ['la force de traction d\'un câble qui tire un chariot dans le sens du mouvement', 0, 'Force et déplacement dans le même sens : travail <b>moteur</b>.'],
      ['le poids d\'une voiture roulant sur une route horizontale', 2, 'Le poids est vertical, le déplacement horizontal : angle de 90°, travail <b>nul</b>.']
    ]);
    return qcmFixed('G', 3, 'Le travail de la force suivante est-il moteur, résistant ou nul : ' + sit[0] + ' ?', ['Moteur (W &gt; 0)', 'Résistant (W &lt; 0)', 'Nul (W = 0)'], sit[1], sit[2]);
  }
  const F = ri(5, 60), d = ri(2, 40), a = pick([100, 120, 135, 150, 180]), W = F * d * Math.cos(rad(a));
  return val('G', 3, 'Une force ' + V('F') + ' (' + S('F') + ' = ' + F + ' N) fait un angle α = ' + a + '° avec le déplacement AB = ' + d + ' m. Calcule le travail W<sub>AB</sub>(' + V('F') + '), avec son signe (3 chiffres significatifs).',
    W, sig(W, 3), 'J', 'W = ' + S('F') + ' × AB × cos α = ' + F + ' × ' + d + ' × cos ' + a + '° ≈ <b>' + sig(W, 3) + ' J</b>. α &gt; 90° donc cos α &lt; 0 : le travail est <b>résistant</b>. Un produit scalaire peut être négatif (contrairement à une valeur).',
    { tol: sigTol(W, 3), traps: [{ val: F * d, msg: 'Tu as oublié cos α.' }, { val: F * d * Math.cos(a), msg: 'Ta calculatrice est en radians : passe-la en degrés.' }], signMsg: 'L\'angle dépasse 90° : cos α est négatif, donc le travail est <b>négatif</b> (résistant). Un produit scalaire peut être négatif.' });
}

/* ---------- fiches ---------- */
const FICHES = {
A: `
<h3>De quoi parle-t-on ?</h3>
<p>Certaines grandeurs sont de simples nombres (masse, énergie, durée, température) : ce sont des grandeurs <b>scalaires</b>. D'autres ont aussi une direction et un sens (force, vitesse, champ, accélération) : ce sont des grandeurs <b>vectorielles</b>, représentées par un vecteur.</p>
<p>Un vecteur ${V('F')} donne <b>quatre informations</b> : son origine (le point d'application), sa direction, son sens et sa <b>valeur</b> (ou norme), notée ${S('F')} = ‖${V('F')}‖, sans flèche.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Un vecteur contient plus d'informations qu'un nombre. Si l'on confond les deux, les égalités n'ont plus de sens et les calculs deviennent faux : c'est l'erreur la plus fréquente dans les copies.</p>
<h3>Règles d'application</h3>
<div class="rule">Pour chaque signe « = » : des vecteurs des deux côtés, ou des nombres des deux côtés. Jamais de mélange.</div>
<ul>
<li><b>Pas d'égalité entre un vecteur et un nombre.</b> ${V('F')} = 12 N est faux ; on écrit ${S('F')} = 12 N.</li>
<li>Le vecteur nul s'écrit <b>${Z}</b> : ${V('P')} + ${V('R')} = ${Z} (et non « = 0 »).</li>
<li>Un vecteur ne s'additionne qu'avec des vecteurs.</li>
<li>Il n'y a pas d'inégalité entre vecteurs : on compare leurs <b>valeurs</b> (${S('F', 1)} &gt; ${S('F', 2)}).</li>
<li><b>On ne « retire pas les flèches »</b> d'une égalité vectorielle : ${V('F')} = ${V('F', 1)} + ${V('F', 2)} n'entraîne <b>pas</b> ${S('F')} = ${S('F', 1)} + ${S('F', 2)}, sauf si les vecteurs sont colinéaires et de même sens.</li>
<li>Une valeur n'est <b>jamais négative</b>. Le sens « vers le bas » ou « vers la gauche » est porté par le vecteur, pas par un signe sur sa valeur.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Un livre immobile est soumis à ${V('P')} et ${V('R')}. Principe d'inertie : ${V('P')} + ${V('R')} = ${Z}, donc ${V('P')} = −${V('R')} : les deux vecteurs ont la même direction, des sens opposés et <b>la même valeur</b> : ${S('P')} = ${S('R')}.<br><span class="muted">Faux : « ${S('P')} + ${S('R')} = 0 » (deux valeurs positives ne peuvent pas avoir une somme nulle) ou « ${S('P')} = −${S('R')} » (valeur négative).</span></div>`,
B: `
<h3>De quoi parle-t-on ?</h3>
<p>Dans un repère, un vecteur ${V('u')} se décompose en un déplacement horizontal x et un déplacement vertical y : ce sont ses <b>coordonnées</b>, notées ${V('u')}(x ; y).</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Les coordonnées transforment les calculs sur les vecteurs en calculs sur des nombres : on peut additionner, soustraire, projeter une relation vectorielle sur des axes.</p>
<h3>Règles d'application</h3>
<ul>
<li>Sur un quadrillage, on compte les carreaux de l'origine à la pointe : x <b>positif vers la droite</b>, négatif vers la gauche ; y <b>positif vers le haut</b>, négatif vers le bas.</li>
<li>Entre deux points : ${V('AB')}(x<sub>B</sub> − x<sub>A</sub> ; y<sub>B</sub> − y<sub>A</sub>) : « arrivée moins départ ».</li>
<li><b>Valeur (norme)</b> par le théorème de Pythagore : <b>u = √(x² + y²)</b>.</li>
<li>Une <b>coordonnée</b> peut être négative ; une <b>valeur</b> jamais.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">${V('v')}(3,0 ; −4,0) en m/s. Valeur : v = √(3,0² + (−4,0)²) = √25 = <b>5,0 m/s</b>. <span class="muted">Faux : 3,0 + 4,0 = 7,0 m/s (on n'additionne pas les coordonnées).</span></div>`,
C: `
<h3>De quoi parle-t-on ?</h3>
<p>Additionner des vecteurs, c'est enchaîner les déplacements : on place les vecteurs <b>bout à bout</b> (l'origine du second sur la pointe du premier). Le vecteur somme va de l'origine du premier à la pointe du dernier. On peut aussi construire le parallélogramme.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>La somme des forces Σ${V('F')} décide du mouvement (principe d'inertie, lois de Newton). La vitesse d'une barque dans un courant est la somme de deux vitesses.</p>
<h3>Règles d'application</h3>
<div class="rule">Les coordonnées s'additionnent : ${V('u')}(x ; y) + ${V('v')}(x' ; y') = ${V('w')}(x + x' ; y + y'). Les valeurs, elles, ne s'additionnent pas en général.</div>
<ul>
<li>Colinéaires, <b>même sens</b> : F = F<sub>1</sub> + F<sub>2</sub> (seul cas où l'on additionne les valeurs).</li>
<li>Colinéaires, <b>sens opposés</b> : F = |F<sub>1</sub> − F<sub>2</sub>|.</li>
<li><b>Perpendiculaires</b> : F = √(F<sub>1</sub>² + F<sub>2</sub>²).</li>
<li>Autres cas : on passe par les coordonnées, ou on construit à l'échelle et on mesure.</li>
<li>Équilibre (objet immobile ou en mouvement rectiligne uniforme) : Σ${V('F')} = ${Z} ; les vecteurs bout à bout forment une figure <b>fermée</b>.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Une barque avance perpendiculairement à la berge à v<sub>1</sub> = 8 km/h, le courant va à v<sub>2</sub> = 5 km/h. ${V('v')} = ${V('v', 1)} + ${V('v', 2)} avec des vecteurs perpendiculaires : v = √(8² + 5²) ≈ <b>9,4 km/h</b>. <span class="muted">Faux : 8 + 5 = 13 km/h.</span></div>`,
D: `
<h3>De quoi parle-t-on ?</h3>
<p>Le vecteur opposé −${V('v')} a la même direction et la même valeur que ${V('v')}, mais le sens contraire. Soustraire, c'est ajouter l'opposé : ${V('v', 2)} − ${V('v', 1)} = ${V('v', 2)} + (−${V('v', 1)}).</p>
<p>En mécanique, le <b>vecteur variation de vitesse</b> est Δ${V('v')} = ${V('v', 2)} − ${V('v', 1)} (vitesse finale moins vitesse initiale).</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Δ${V('v')} est lié à la somme des forces : Σ${V('F')} ≈ m Δ${V('v')} / Δt. Pour savoir quelles forces agissent, il faut savoir construire Δ${V('v')}.</p>
<h3>Règles d'application</h3>
<ul>
<li>Construction : on trace ${V('v', 1)} et ${V('v', 2)} à partir du même point ; Δ${V('v')} va de la pointe de ${V('v', 1)} à la pointe de ${V('v', 2)}.</li>
<li>Coordonnées : Δ${V('v')}(x<sub>2</sub> − x<sub>1</sub> ; y<sub>2</sub> − y<sub>1</sub>).</li>
<li>Δv = v<sub>2</sub> − v<sub>1</sub> <b>seulement</b> si les vitesses sont colinéaires et de même sens (mouvement rectiligne). Et Δv reste positive : en freinage, c'est le <b>sens</b> de Δ${V('v')} (opposé au mouvement) qui le montre.</li>
<li>Mouvement circulaire uniforme : la valeur de la vitesse est constante, mais Δ${V('v')} n'est pas nul (la direction change) ; il est dirigé vers le centre.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Une voiture passe de 40 m/s vers l'est à 40 m/s vers le nord. La valeur de la vitesse n'a pas changé, mais Δv = √(40² + 40²) ≈ <b>57 m/s</b>. <span class="muted">Faux : Δv = 40 − 40 = 0.</span></div>`,
E: `
<h3>De quoi parle-t-on ?</h3>
<p>Multiplier un vecteur ${V('u')} par un nombre k donne un vecteur k${V('u')} <b>colinéaire</b> à ${V('u')} (même direction).</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Beaucoup de lois de la physique sont de cette forme : ${V('P')} = m${V('g')}, ${V('F')} = q${V('E')}, Σ${V('F')} = m${V('a')}. Elles donnent à la fois la direction, le sens et la valeur.</p>
<h3>Règles d'application</h3>
<ul>
<li>k &gt; 0 : <b>même sens</b> que ${V('u')} ; k &lt; 0 : <b>sens opposé</b>.</li>
<li>Valeur : <b>|k| × u</b>, toujours positive. Exemple : F = |q| × E.</li>
<li>Phrase type : « D'après l'expression vectorielle ${V('F')} = q${V('E')}, les vecteurs ${V('F')} et ${V('E')} ont des sens opposés car q &lt; 0. »</li>
<li>Pour la valeur, on utilise l'expression <b>en valeurs</b> (sans flèches) ; pour le sens, l'expression <b>vectorielle</b>.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Un électron (q = −e) dans un champ E = 2,0×10<sup>4</sup> V/m : F = |q| E = 1,602×10<sup>−19</sup> × 2,0×10<sup>4</sup> ≈ <b>3,2×10<sup>−15</sup> N</b>, et ${V('F')} est de sens opposé à ${V('E')} car q &lt; 0.</div>`,
F: `
<h3>De quoi parle-t-on ?</h3>
<p>Projeter un vecteur sur un axe, c'est trouver son « ombre » sur cet axe : c'est sa coordonnée sur cet axe. On la calcule avec la trigonométrie dans le triangle rectangle.</p>
<h3>Pourquoi est-ce important ?</h3>
<p>Une relation vectorielle (Σ${V('F')} = ${Z}, Σ${V('F')} = m${V('a')}) se transforme en <b>deux équations entre nombres</b> en la projetant sur deux axes. C'est la méthode pour calculer des forces inconnues (plan incliné, mouvement dans un champ…).</p>
<h3>Règles d'application</h3>
<ul>
<li>Si α est l'angle entre ${V('F')} et l'axe x : F<sub>x</sub> = ± F cos α (côté <b>adjacent</b>) et F<sub>y</sub> = ± F sin α (côté <b>opposé</b>).</li>
<li><b>Signe</b> : positif si le vecteur pointe dans le sens de l'axe, négatif sinon. Le poids, avec un axe y vers le haut : P<sub>y</sub> = −m g.</li>
<li>Calculatrice en <b>degrés</b> !</li>
<li>Plan incliné d'angle α, axe x le long de la pente vers le bas : P<sub>x</sub> = m g sin α et P<sub>y</sub> = −m g cos α.</li>
<li>Après projection on obtient des <b>coordonnées</b> (qui peuvent être négatives), pas des valeurs.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Caisse immobile sur une pente à 30°, m = 2,0 kg. ${V('P')} + ${V('R')} + ${V('f')} = ${Z}. Sur x : m g sin α − f = 0, donc f = 2,0 × 9,81 × sin 30° ≈ <b>9,8 N</b>. Sur y : R − m g cos α = 0, donc R ≈ <b>17 N</b>.</div>`,
G: `
<h3>De quoi parle-t-on ?</h3>
<p>Le <b>produit scalaire</b> de deux vecteurs est un <b>nombre</b> : ${V('u')}·${V('v')} = u × v × cos θ (θ : angle entre les vecteurs) = x x' + y y' (en coordonnées).</p>
<h3>Pourquoi est-ce important ?</h3>
<p>En physique, le <b>travail</b> d'une force constante sur un déplacement AB est un produit scalaire : W<sub>AB</sub>(${V('F')}) = ${V('F')}·${V('AB')} = F × AB × cos α, en joules. Il intervient dans le théorème de l'énergie cinétique.</p>
<h3>Règles d'application</h3>
<ul>
<li>Le résultat est un <b>nombre</b> (jamais un vecteur) qui <b>peut être négatif</b>.</li>
<li>α &lt; 90° : W &gt; 0, travail <b>moteur</b> ; α &gt; 90° : W &lt; 0, travail <b>résistant</b> ; α = 90° : W = 0 (force perpendiculaire au déplacement).</li>
<li>Seule la composante de la force <b>le long du déplacement</b> travaille : c'est la projection F cos α.</li>
<li>Travail du poids : W = m g (z<sub>A</sub> − z<sub>B</sub>), négatif quand on monte.</li>
</ul>
<h3>Exemple corrigé</h3>
<div class="ex">Une force de 50 N tire une luge sur 20 m avec un angle de 30° : W = 50 × 20 × cos 30° ≈ <b>8,7×10<sup>2</sup> J</b> (travail moteur). <span class="muted">Faux : 50 × 20 = 1 000 J (oubli du cos α).</span></div>`
};

(window.RPC_NOTIONS = window.RPC_NOTIONS || {})['vecteurs'] = {
  titre: 'Les vecteurs en physique-chimie',
  niveau: 'Seconde à Terminale',
  themes: THEMES,
  rappels: RAPPELS,
  fiches: FICHES,
  gen: { A: genA, B: genB, C: genC, D: genD, E: genE, F: genF, G: genG },
  testLevels: { A: [2, 3], B: [1, 2], C: [2, 3], D: [2, 3], E: [1, 2], F: [1, 3], G: [1, 2] },
  aide: 'Les vecteurs sont notés avec une flèche (' + V('F') + '), leurs valeurs sans flèche (F). Pour un nombre négatif, tape le signe − (bouton « − »). Pour une puissance de 10, tape par exemple <b>3,2×10^-15</b> ou <b>3,2e-15</b>. Calculatrice en <b>degrés</b>.'
};
})();
