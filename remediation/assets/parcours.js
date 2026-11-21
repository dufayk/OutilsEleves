/* =====================================================================
   Remédiation Physique Chimie – moteur du parcours d'une notion
   Diagnostic → Remédiation (fiche + entraînement adaptatif) → Test final → Rapport PDF
   Fonctionne pour toute notion déclarée dans window.RPC_NOTIONS.
   ===================================================================== */
(function () {
'use strict';
const R = window.RPC, NUM = window.NUM;
const SERIES = 5, SEUIL = 4;
const BRAND = 'Remédiation Physique Chimie';

let ID, NOT, T, KEYS, ALL, N, STORE, DEMO, app;
let ui = { sel: null }, resetArmed = false;

function grade(q, a) { return (NOT.grade || NUM.grade)(q, a); }
function buildTest() { const qs = []; KEYS.forEach(k => (NOT.testLevels[k] || [1, 2]).forEach(l => qs.push(NOT.gen[k](l)))); return qs; }
function nTest() { return KEYS.reduce((a, k) => a + (NOT.testLevels[k] || [1, 2]).length, 0); }
function save() {
  // on relit l'état complet pour ne pas écraser une autre notion ouverte dans un autre onglet
  const cur = R.load(STORE);
  if (cur.student) ALL.student = cur.student;
  ALL.notions = Object.assign({}, cur.notions, { [ID]: N });
  R.save(ALL, STORE);
}
const esc = R.esc, pctOf = R.pctOf, cls = R.cls;
function byTheme(items) { const r = {}; KEYS.forEach(k => r[k] = { ok: 0, n: 0 }); items.forEach(x => { if (r[x.theme]) { r[x.theme].n++; if (x.ok) r[x.theme].ok++; } }); return r; }
function now() { return Date.now(); }
function studentName() { return ALL.student.prenom + ' ' + ALL.student.nom; }

/* statut d'un thème = dernier événement (diagnostic, test final ou série d'entraînement) */
function status(k) {
  const ev = [];
  if (N.diag) { const b = byTheme(N.diag.items)[k]; ev.push({ t: N.diag.t, ok: b.ok === b.n, src: 'diag' }); }
  N.finals.forEach(f => { const b = byTheme(f.items)[k]; ev.push({ t: f.t, ok: b.ok === b.n, src: 'final' }); });
  (N.train[k] || []).forEach(s => ev.push({ t: s.t, ok: s.ok >= SEUIL, src: 'train' }));
  if (!ev.length) return { code: 'na', label: 'Non évalué' };
  const last = ev.sort((a, b) => a.t - b.t)[ev.length - 1];
  if (last.ok) return { code: 'ok', label: last.src === 'train' ? 'Consolidé' : 'Acquis' };
  return { code: 'ko', label: 'À retravailler' };
}

/* ---------- navigation ---------- */
function stepsBar() {
  const steps = [['diag', 'Diagnostic'], ['hub', 'Remédiation'], ['final', 'Test final'], ['report', 'Rapport']];
  const qmode = N.quiz ? N.quiz.mode : null;
  const map = { intro: 'diag', quiz: qmode === 'final' ? 'final' : 'diag', diagResult: 'diag', hub: 'hub', fiche: 'hub', train: 'hub', finalResult: 'final', report: 'report' };
  const cur = map[N.screen] || 'diag';
  const order = steps.map(s => s[0]);
  // écran atteint quand on clique sur l'étape (null = pas encore accessible)
  const target = {
    diag: qmode === 'diag' ? 'quiz' : N.diag ? 'diagResult' : 'intro',
    hub: N.diag ? 'hub' : null,
    final: qmode === 'final' ? 'quiz' : N.finals.length ? 'finalResult' : null,
    report: N.finals.length ? 'report' : null
  };
  const done = { diag: !!N.diag, hub: Object.keys(N.train).length > 0, final: N.finals.length > 0, report: false };
  document.getElementById('steps').innerHTML = steps.map(([k, l]) => {
    const c = [k === cur ? 'on' : (done[k] && order.indexOf(k) < order.indexOf(cur) ? 'done' : '')];
    if (target[k] && k !== cur) c.push('go');
    return '<button type="button" class="' + c.join(' ') + '"' + (target[k] && k !== cur ? ' data-go="' + target[k] + '"' : ' tabindex="-1"') + '>' + l + '</button>';
  }).join('');
}
function go(screen) { N.screen = screen; save(); render(); window.scrollTo(0, 0); }

function render() {
  stepsBar();
  const f = { intro: vIntro, quiz: vQuiz, diagResult: vDiagResult, hub: vHub, fiche: vFiche, train: vTrain, finalResult: vFinalResult, report: vReport }[N.screen] || vIntro;
  app.innerHTML = f();
  const inp = app.querySelector('input[data-answer]');
  if (inp) inp.focus();
}

function saveCard() {
  return '<div class="card"><h2>Continuer un autre jour ?</h2><p>Ta progression est enregistrée <b>sur cet appareil</b>, dans ce navigateur. Si tu changes d\'appareil, si tu es en navigation privée ou sur un ordinateur partagé, télécharge ton fichier de sauvegarde avant de partir (il contient <b>toutes</b> tes notions).</p>' +
    '<div class="row"><button class="btn ghost" data-a="saveFile">Sauvegarder ma progression (fichier)</button><a class="btn ghost" href="index.html">Retour à l\'accueil</a></div><p id="savemsg" class="muted" style="margin-top:8px"></p></div>';
}

/* ---------- écrans ---------- */
function vIntro() {
  const n = nTest();
  return '<div class="card"><div class="qhead"><span>' + esc(NOT.niveau || '') + '</span></div><h1>' + esc(NOT.titre) + '</h1>' +
    '<p>Ce parcours s\'adapte à toi :</p><ol class="steps-list">' +
    '<li><b>Test diagnostique</b> (' + n + ' questions) : on repère ce qui est acquis et ce qui ne l\'est pas.</li>' +
    '<li><b>Remédiation</b> : pour chaque point à retravailler, une fiche de cours puis des exercices corrigés qui s\'adaptent à tes réponses.</li>' +
    '<li><b>Test final</b> (' + n + ' questions) : tu mesures ta progression. Tu peux le refaire pour améliorer ton score.</li>' +
    '<li><b>Rapport PDF</b> : tu le télécharges et tu l\'envoies à ton professeur.</li></ol>' +
    '<h3>Les points travaillés</h3><ul class="plain">' + KEYS.map(k => '<li>' + T[k] + '</li>').join('') + '</ul>' +
    (NOT.aide ? '<p class="muted">' + NOT.aide + '</p>' : '') +
    '<div class="row" style="margin-top:14px"><button class="btn" data-a="startDiag">Commencer le test diagnostique</button><a class="btn ghost" href="index.html">Choisir une autre notion</a></div></div>';
}

function inputHtml(q, locked, val) {
  if (q.kind === 'qcm') {
    return '<div class="opts">' + q.options.map((o, i) => '<button class="opt" data-a="sel" data-i="' + i + '" aria-pressed="' + (String(val) === String(i)) + '"' + (locked ? ' disabled' : '') + '>' + o + '</button>').join('') + '</div>';
  }
  const ph = q.kind === 'int' ? 'un nombre entier' : q.kind === 'val' ? 'ex : −3 ou 12,5' : 'ex : 4,70×10^-3 ou 0,00470';
  return '<div class="answer-line"><input class="t" data-answer type="text" ' + (q.kind === 'int' ? 'inputmode="numeric"' : 'inputmode="text"') + ' autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + ph + '" value="' + esc(val || '') + '"' + (locked ? ' disabled' : '') + '>' +
    ((q.kind === 'num' || q.kind === 'val') && !locked ? '<button class="btn ghost small" data-a="ins" data-s="×10^">×10^</button><button class="btn ghost small" data-a="ins" data-s="-">−</button>' : '') + '</div>' +
    (q.kind === 'num' ? '<div class="helper">Écris seulement le nombre (sans l\'unité). Exemple : 3,20×10^-2 se tape 3,20×10^-2 ou 3,20e-2.</div>' : '') +
    (q.kind === 'val' ? '<div class="helper">' + (q.helper || 'Écris seulement le nombre (sans l\'unité). Un nombre négatif s\'écrit avec le signe −.') + '</div>' : '');
}
function readAnswer(q) {
  if (q.kind === 'qcm') return ui.sel;
  const el = app.querySelector('input[data-answer]');
  return el ? el.value : '';
}
function record(q, g) { return { theme: q.theme, level: q.level, html: q.html, text: q.text, answerHtml: q.answerHtml, answerText: q.answerText, expl: q.expl, student: g.student, ok: g.ok, msg: g.msg }; }

/* diagnostic et test final */
function startQuiz(mode) { N.quiz = { mode, qs: buildTest(), i: 0, items: [] }; ui.sel = null; go('quiz'); }
function vQuiz() {
  const z = N.quiz, q = z.qs[z.i], n = z.qs.length;
  return '<div class="card"><div class="qhead"><span>' + (z.mode === 'diag' ? 'Test diagnostique' : 'Test final') + ' – question ' + (z.i + 1) + ' / ' + n + '</span><span class="tag">' + T[q.theme] + '</span></div>' +
    '<div class="bar"><i style="width:' + Math.round(100 * z.i / n) + '%"></i></div>' +
    '<p class="prompt" style="margin-top:16px">' + q.html + '</p>' + inputHtml(q, false, '') +
    '<p class="muted" style="font-size:.85rem;margin-top:10px">La correction sera donnée à la fin du test.</p>' +
    '<div class="row end"><button class="btn" data-a="qok">' + (z.i + 1 < n ? 'Valider et continuer' : 'Valider et terminer') + '</button></div></div>';
}
function quizSubmit() {
  const z = N.quiz, q = z.qs[z.i];
  z.items.push(record(q, grade(q, readAnswer(q))));
  ui.sel = null;
  if (z.i + 1 < z.qs.length) { z.i++; save(); render(); return; }
  const rec = { t: now(), items: z.items, pct: pctOf(z.items) };
  if (z.mode === 'diag') { N.diag = rec; N.quiz = null; go('diagResult'); }
  else { N.finals.push(rec); N.quiz = null; go('finalResult'); }
}

function themeTable(items) {
  const b = byTheme(items);
  return '<div class="themes">' + KEYS.map(k => {
    const x = b[k], full = x.ok === x.n;
    return '<div class="theme"><span class="nm">' + T[k] + '</span><span class="row"><span class="muted">' + x.ok + ' / ' + x.n + '</span><span class="st ' + (full ? 'ok' : 'ko') + '">' + (full ? 'Acquis' : 'À retravailler') + '</span></span></div>';
  }).join('') + '</div>';
}
function correction(items) {
  return '<details><summary>Voir la correction détaillée</summary><div class="scroll"><table class="tb"><thead><tr><th>#</th><th>Question</th><th>Ta réponse</th><th>Attendu</th><th></th></tr></thead><tbody>' +
    items.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + x.html + (x.ok ? '' : '<div class="muted" style="font-size:.85rem;margin-top:4px">' + (x.msg ? x.msg + ' ' : '') + x.expl + '</div>') + '</td><td>' + esc(x.student) + '</td><td>' + x.answerHtml + '</td><td class="' + (x.ok ? 'okc' : 'koc') + '">' + (x.ok ? 'Juste' : 'Faux') + '</td></tr>').join('') +
    '</tbody></table></div></details>';
}
function vDiagResult() {
  const d = N.diag, p = d.pct, b = byTheme(d.items);
  const weak = KEYS.filter(k => b[k].ok < b[k].n);
  return '<div class="card"><h1>Résultat du test diagnostique</h1><div class="big ' + cls(p) + '">' + p + ' %</div><p class="muted">' + d.items.filter(x => x.ok).length + ' réponses justes sur ' + d.items.length + '</p></div>' +
    '<div class="card"><h2>Bilan par point travaillé</h2>' + themeTable(d.items) + correction(d.items) + '</div>' +
    '<div class="card">' + (weak.length ? '<p><b>' + weak.length + ' point' + (weak.length > 1 ? 's' : '') + ' à retravailler.</b> Pour chacun : la fiche de cours, puis une série d\'exercices adaptés.</p><div class="row"><button class="btn" data-a="hub">Commencer ma remédiation</button></div>'
      : '<p><b>Bravo, tout est acquis !</b> Tu peux passer directement au test final, ou revoir les fiches si tu veux.</p><div class="row"><button class="btn" data-a="startFinal">Passer au test final</button><button class="btn ghost" data-a="hub">Voir les fiches</button></div>') + '</div>' + saveCard();
}

function vHub() {
  const rows = KEYS.map(k => {
    const s = status(k), ser = N.train[k] || [];
    const last = ser.length ? ser[ser.length - 1] : null;
    return '<div class="theme"><div><div class="nm">' + T[k] + '</div><div class="muted" style="font-size:.85rem">' + (ser.length ? ser.length + ' série' + (ser.length > 1 ? 's' : '') + ' faite' + (ser.length > 1 ? 's' : '') + ' – dernière : ' + last.ok + ' / ' + last.n : 'Aucune série faite') + '</div></div>' +
      '<div class="row"><span class="st ' + s.code + '">' + s.label + '</span><button class="btn ' + (s.code === 'ko' ? '' : 'ghost ') + 'small" data-a="fiche" data-k="' + k + '">' + (s.code === 'ko' ? 'Travailler' : 'Revoir') + '</button></div></div>';
  }).join('');
  const todo = KEYS.filter(k => status(k).code === 'ko');
  return '<div class="card"><h1>Remédiation</h1><p>' + (todo.length ? 'Commence par les points <b>à retravailler</b>. Les points acquis restent disponibles si tu veux les revoir.' : 'Tous les points sont acquis ou consolidés. Tu peux passer au test final.') + '</p><div class="themes">' + rows + '</div></div>' +
    '<div class="card"><div class="row"><button class="btn" data-a="startFinal">' + (N.finals.length ? 'Refaire le test final' : 'Passer au test final') + '</button>' + (N.finals.length ? '<button class="btn ghost" data-a="report">Mon rapport PDF</button>' : '') + '</div>' +
    (todo.length && !N.finals.length ? '<p class="muted" style="margin-top:10px">Conseil : travaille d\'abord les points à retravailler avant le test final.</p>' : '') + '</div>' + saveCard() + resetCard();
}
function resetCard() {
  return '<div class="card"><details><summary>Recommencer cette notion à zéro</summary><p style="margin-top:10px">Ton diagnostic, tes séries d\'entraînement et tes tests finaux sur « ' + esc(NOT.titre) + ' » seront effacés. Les autres notions ne sont pas touchées.</p>' +
    '<button class="btn danger small" data-a="resetNotion">' + (resetArmed ? 'Confirmer : tout effacer pour cette notion' : 'Recommencer cette notion') + '</button></details></div>';
}

function vFiche() {
  const k = N.fiche;
  return '<div class="card fiche"><div class="qhead"><span>Fiche de cours</span><span class="tag">' + T[k] + '</span></div><h1>' + T[k] + '</h1>' + NOT.fiches[k] + '</div>' +
    '<div class="card"><div class="row"><button class="btn" data-a="train" data-k="' + k + '">M\'entraîner (' + SERIES + ' exercices)</button><button class="btn ghost" data-a="hub">Retour à la remédiation</button></div></div>';
}

/* entraînement adaptatif */
function newTrainQ(run) { run.q = NOT.gen[run.k](run.level); run.phase = 'ask'; run.val = ''; ui.sel = null; }
function startTrain(k) { N.run = { k, level: 1, streakKo: 0, items: [], rappel: false }; newTrainQ(N.run); go('train'); }
function vTrain() {
  const r = N.run, q = r.q, k = r.k;
  const dots = '<div class="dots">' + Array.from({ length: SERIES }, (_, i) => '<i class="' + (r.items[i] ? (r.items[i].ok ? 'ok' : 'ko') : '') + '"></i>').join('') + '</div>';
  if (r.phase === 'end') {
    const ok = r.items.filter(x => x.ok).length;
    return '<div class="card"><div class="qhead"><span>Entraînement terminé</span><span class="tag">' + T[k] + '</span></div>' + dots +
      '<div class="big ' + cls(100 * ok / SERIES) + '">' + ok + ' / ' + SERIES + '</div>' +
      '<p>' + (ok >= SEUIL ? '<b>Point consolidé.</b> Tu peux passer au suivant.' : 'Encore un effort : relis la fiche et refais une série.') + '</p>' +
      '<div class="row"><button class="btn" data-a="' + (ok >= SEUIL ? 'hub' : 'train') + '" data-k="' + k + '">' + (ok >= SEUIL ? 'Point suivant' : 'Refaire une série') + '</button>' +
      '<button class="btn ghost" data-a="fiche" data-k="' + k + '">Relire la fiche</button>' + (ok >= SEUIL ? '<button class="btn ghost" data-a="train" data-k="' + k + '">Une autre série</button>' : '<button class="btn ghost" data-a="hub">Retour à la remédiation</button>') + '</div></div>';
  }
  const locked = r.phase === 'fb';
  let fb = '';
  if (locked) {
    const last = r.items[r.items.length - 1];
    fb = '<div class="fb ' + (last.ok ? 'ok' : 'ko') + '"><b class="t">' + (last.ok ? 'Juste !' : 'Pas tout à fait.') + '</b>' + (last.ok ? '' : (last.msg ? '<p>' + last.msg + '</p>' : '') + '<p>Réponse attendue : <b>' + last.answerHtml + '</b></p>') + '<p style="margin:0">' + last.expl + '</p></div>' +
      (r.rappel ? '<div class="fb info"><b class="t">Rappel de la règle</b>' + NOT.rappels[k] + '<br><span class="muted">La prochaine question sera plus simple.</span></div>' : '');
  }
  return '<div class="card"><div class="qhead"><span>Entraînement – exercice ' + Math.min(r.items.length + (locked ? 0 : 1), SERIES) + ' / ' + SERIES + ' · niveau ' + q.level + '</span><span class="tag">' + T[k] + '</span></div>' + dots +
    '<p class="prompt" style="margin-top:14px">' + q.html + '</p>' + inputHtml(q, locked, locked ? r.val : '') + fb +
    '<div class="row end" style="margin-top:12px">' + (locked ? '<button class="btn" data-a="tnext">' + (r.items.length >= SERIES ? 'Voir mon bilan' : 'Exercice suivant') + '</button>' : '<button class="btn" data-a="tok">Valider</button>') + '</div></div>';
}
function trainSubmit() {
  const r = N.run, q = r.q;
  const a = readAnswer(q);
  if (q.kind === 'qcm' && (a === null || a === undefined)) return;
  if (q.kind !== 'qcm' && !String(a).trim()) return;
  const g = grade(q, a);
  r.val = a;
  r.items.push(record(q, g));
  r.rappel = false;
  if (g.ok) { r.streakKo = 0; r.level = Math.min(3, r.level + 1); }
  else { r.streakKo++; if (r.streakKo >= 2) { r.level = 1; r.rappel = true; r.streakKo = 0; } }
  r.phase = 'fb';
  save(); render();
  const btn = app.querySelector('[data-a="tnext"]'); if (btn) btn.focus();
}
function trainNext() {
  const r = N.run;
  if (r.items.length >= SERIES) {
    const ok = r.items.filter(x => x.ok).length;
    (N.train[r.k] = N.train[r.k] || []).push({ t: now(), ok, n: SERIES, items: r.items });
    r.phase = 'end'; save(); render(); return;
  }
  newTrainQ(r); save(); render();
}

function kpis() {
  const last = N.finals[N.finals.length - 1], p = last.pct;
  const best = Math.max(...N.finals.map(x => x.pct));
  const dp = p - N.diag.pct;
  return '<div class="kpis">' +
    '<div class="kpi"><small>Test diagnostique</small><div class="big ' + cls(N.diag.pct) + '">' + N.diag.pct + ' %</div></div>' +
    '<div class="kpi"><small>Test final (tentative ' + N.finals.length + ')</small><div class="big ' + cls(p) + '">' + p + ' %</div></div>' +
    '<div class="kpi"><small>Progression</small><div class="big ' + (dp > 0 ? 'ok' : dp === 0 ? 'mid' : 'ko') + '">' + (dp >= 0 ? '+' : '') + dp + ' pts</div></div>' +
    '<div class="kpi"><small>Meilleur score final</small><div class="big ' + cls(best) + '">' + best + ' %</div></div></div>';
}
function vFinalResult() {
  const f = N.finals[N.finals.length - 1];
  return '<div class="card"><h1>Résultat du test final</h1>' + kpis() + '</div>' +
    '<div class="card"><h2>Bilan par point travaillé</h2>' + themeTable(f.items) + correction(f.items) + '</div>' +
    '<div class="card"><h2>Et maintenant ?</h2><p>Tu peux améliorer ton score : retravaille les points faibles puis refais le test (les questions changent à chaque fois). Le rapport contiendra toutes tes tentatives.</p>' +
    '<div class="row"><button class="btn" data-a="report">Voir mon rapport</button><button class="btn ghost" data-a="startFinal">Refaire le test final</button><button class="btn ghost" data-a="hub">Retravailler</button></div></div>' + saveCard();
}

function vReport() {
  const last = N.finals[N.finals.length - 1];
  const bD = byTheme(N.diag.items), bL = byTheme(last.items);
  const weak = KEYS.filter(k => bL[k].ok < bL[k].n);
  const rows = KEYS.map(k => {
    const ser = N.train[k] || [], tok = ser.reduce((a, s) => a + s.ok, 0), tn = ser.reduce((a, s) => a + s.n, 0), s = status(k);
    return '<tr><td>' + T[k] + '</td><td>' + bD[k].ok + ' / ' + bD[k].n + '</td><td>' + (tn ? tok + ' / ' + tn : '–') + '</td><td>' + bL[k].ok + ' / ' + bL[k].n + '</td><td><span class="st ' + s.code + '">' + s.label + '</span></td></tr>';
  }).join('');
  return '<div class="card"><h1>Mon rapport</h1><p class="muted">' + esc(studentName()) + ' · ' + esc(NOT.titre) + '</p>' + kpis() + '</div>' +
    '<div class="card"><h2>Synthèse par point</h2><div class="scroll"><table class="tb"><thead><tr><th>Point travaillé</th><th>Diagnostic</th><th>Entraînement</th><th>Dernier test final</th><th>Statut</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p style="margin-top:12px"><b>Encore à retravailler :</b> ' + (weak.length ? weak.map(k => T[k]).join(' ; ') : 'rien, toutes les questions du dernier test final sont réussies.') + '</p></div>' +
    '<div class="card"><h2>Envoyer à mon professeur</h2><p>Le PDF reprend cette synthèse et le détail de toutes tes réponses (diagnostic, entraînement, tests finaux).</p>' +
    '<div class="row"><button class="btn" data-a="pdf">Télécharger mon rapport PDF</button><button class="btn ghost" data-a="startFinal">Refaire le test final</button><a class="btn ghost" href="index.html">Travailler une autre notion</a></div><p id="pdfmsg" class="muted" style="margin-top:10px"></p></div>' + saveCard();
}

/* ---------- PDF ---------- */
const CP1252 = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function brk(s, n) { return String(s).split(' ').map(w => w.length > n ? w.match(new RegExp('.{1,' + n + '}', 'g')).join(' ') : w).join(' '); }
function pdfTxt(s) {
  s = String(s).replace(/−/g, '-').replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 8320)).replace(/ρ/g, 'rho').replace(/λ/g, 'lambda').replace(/θ/g, 'theta').replace(/Δ/g, 'Delta ')
    .replace(/α/g, 'alpha').replace(/β/g, 'beta').replace(/Σ/g, 'Somme ').replace(/√/g, 'racine').replace(/[‖⃗]/g, '').replace(/⊥/g, ' perpendiculaire a ').replace(/≠/g, '!=')
    .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≈/g, '~').replace(/→/g, '->').replace(/ | /g, ' ');
  return s.split('').map(c => (c.charCodeAt(0) < 256 || CP1252.includes(c)) ? c : '?').join('');
}
function makePdf() {
  const msg = document.getElementById('pdfmsg');
  if (!window.jspdf || !window.jspdf.jsPDF) { if (msg) msg.textContent = 'La bibliothèque PDF n\'a pas pu se charger. Vérifie ta connexion internet puis recharge la page (ton parcours est conservé).'; return; }
  const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
  if (typeof doc.autoTable !== 'function') { if (msg) msg.textContent = 'Module de tableaux PDF indisponible : recharge la page.'; return; }
  const W = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleString('fr-FR');
  const blue = [31, 95, 168];
  doc.setFillColor(...blue); doc.rect(0, 0, W, 26, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(pdfTxt('Rapport - ' + NOT.titre), 14, 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(pdfTxt(BRAND + (NOT.niveau ? ' - ' + NOT.niveau : '')), 14, 19);
  doc.setTextColor(28, 36, 48); doc.setFontSize(11);
  doc.text(pdfTxt('Élève : ' + studentName()), 14, 35);
  doc.text(pdfTxt('Rapport généré le ' + dateStr), 14, 41);
  const last = N.finals[N.finals.length - 1];
  const best = N.finals.reduce((a, f) => f.pct > a.pct ? f : a, N.finals[0]);
  const ok = it => it.filter(x => x.ok).length + ' / ' + it.length;
  const common = { theme: 'grid', styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 1.8, overflow: 'linebreak', textColor: [28, 36, 48] }, headStyles: { fillColor: blue, textColor: 255 }, margin: { left: 14, right: 14 } };
  doc.autoTable(Object.assign({}, common, { startY: 47, head: [[pdfTxt('Étape'), 'Score', pdfTxt('Réussite')]],
    body: [[pdfTxt('Test diagnostique (' + new Date(N.diag.t).toLocaleString('fr-FR') + ')'), ok(N.diag.items), N.diag.pct + ' %']]
      .concat(N.finals.map((f, i) => [pdfTxt('Test final - tentative ' + (i + 1) + ' (' + new Date(f.t).toLocaleString('fr-FR') + ')'), ok(f.items), f.pct + ' %']))
      .concat([[pdfTxt('Meilleur score au test final'), ok(best.items), best.pct + ' %'], [pdfTxt('Progression (dernier test final - diagnostic)'), '', (last.pct - N.diag.pct >= 0 ? '+' : '') + (last.pct - N.diag.pct) + ' points']]),
    styles: Object.assign({}, common.styles, { fontSize: 10 }) }));
  const bD = byTheme(N.diag.items), bL = byTheme(last.items);
  doc.autoTable(Object.assign({}, common, { startY: doc.lastAutoTable.finalY + 6, head: [[pdfTxt('Point travaillé'), 'Diagnostic', pdfTxt('Entraînement (réussis / faits)'), 'Dernier test final', pdfTxt('Statut actuel')]],
    body: KEYS.map(k => { const ser = N.train[k] || []; const tok = ser.reduce((a, s) => a + s.ok, 0), tn = ser.reduce((a, s) => a + s.n, 0);
      return [pdfTxt(T[k]), bD[k].ok + ' / ' + bD[k].n, tn ? tok + ' / ' + tn + ' (' + ser.length + ' série' + (ser.length > 1 ? 's' : '') + ')' : '-', bL[k].ok + ' / ' + bL[k].n, pdfTxt(status(k).label)]; }),
    styles: Object.assign({}, common.styles, { fontSize: 9.5 }) }));
  const weak = KEYS.filter(k => bL[k].ok < bL[k].n);
  let y = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(pdfTxt('Points encore à retravailler (dernier test final) :'), 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(pdfTxt(weak.length ? weak.map(k => T[k]).join(' ; ') : 'aucun - tous les points sont réussis.'), W - 28), 14, y + 6);
  function detail(title, items) {
    doc.addPage(); y = 16;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(pdfTxt(title), 14, y);
    doc.autoTable(Object.assign({}, common, { startY: y + 3, head: [['#', pdfTxt('Point'), 'Question', pdfTxt('Réponse de l\'élève'), pdfTxt('Réponse attendue'), '']],
      body: items.map((x, i) => [String(i + 1), pdfTxt(T[x.theme] || x.theme), brk(pdfTxt(x.text), 40), brk(pdfTxt(x.student), 12), brk(pdfTxt(x.answerText), 12), x.ok ? 'Juste' : 'Faux']),
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 26 }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 }, 5: { cellWidth: 13 } },
      didParseCell: d => { if (d.section === 'body' && d.column.index === 5) d.cell.styles.textColor = d.cell.raw === 'Juste' ? [29, 122, 70] : [179, 38, 30]; } }));
  }
  detail('Détail du test diagnostique (' + N.diag.pct + ' %)', N.diag.items);
  const allTrain = [];
  KEYS.forEach(k => (N.train[k] || []).forEach(s => s.items.forEach(it => allTrain.push(it))));
  if (allTrain.length) detail('Détail des exercices d\'entraînement (' + allTrain.filter(x => x.ok).length + ' / ' + allTrain.length + ' réussis)', allTrain);
  N.finals.forEach((f, i) => detail('Détail du test final - tentative ' + (i + 1) + ' (' + f.pct + ' %)', f.items));
  const np = doc.internal.getNumberOfPages();
  for (let i = 1; i <= np; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120); doc.text(pdfTxt(studentName() + ' - ' + NOT.titre + ' - page ' + i + ' / ' + np), W / 2, 290, { align: 'center' }); }
  const fname = 'Remediation-PC_' + R.safeName(NOT.titre) + '_' + R.safeName(ALL.student.nom) + '_' + R.safeName(ALL.student.prenom) + '.pdf';
  const url = R.downloadBlob(fname, doc.output('blob'));
  if (msg) msg.innerHTML = 'Rapport prêt : <b>' + esc(fname) + '</b>. Envoie-le à ton professeur.<br>Si le téléchargement n\'a pas démarré, <a href="' + url + '" download="' + esc(fname) + '">clique ici pour l\'enregistrer</a>.';
}

/* ---------- événements ---------- */
function bind() {
  document.getElementById('steps').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a !== 'resetNotion') resetArmed = false;
    if (a === 'startDiag') startQuiz('diag');
    else if (a === 'sel') { ui.sel = +b.dataset.i; app.querySelectorAll('.opt').forEach(o => o.setAttribute('aria-pressed', o === b ? 'true' : 'false')); }
    else if (a === 'ins') { const el = app.querySelector('input[data-answer]'); if (el) { const s = b.dataset.s, p = el.selectionStart ?? el.value.length; el.value = el.value.slice(0, p) + s + el.value.slice(el.selectionEnd ?? p); el.focus(); el.setSelectionRange(p + s.length, p + s.length); } }
    else if (a === 'qok') quizSubmit();
    else if (a === 'hub') go('hub');
    else if (a === 'fiche') { N.fiche = b.dataset.k; go('fiche'); }
    else if (a === 'train') startTrain(b.dataset.k);
    else if (a === 'tok') trainSubmit();
    else if (a === 'tnext') trainNext();
    else if (a === 'startFinal') startQuiz('final');
    else if (a === 'report') go('report');
    else if (a === 'resetNotion') {
      if (!resetArmed) { resetArmed = true; render(); const d = app.querySelector('details:last-of-type'); if (d) d.open = true; }
      else { resetArmed = false; N = R.freshNotion(); go('intro'); }
    }
    else if (a === 'saveFile') {
      save();
      const name = R.exportState(R.load(STORE));
      const m = document.getElementById('savemsg'); if (m) m.innerHTML = 'Fichier <b>' + esc(name) + '</b> téléchargé. Garde-le précieusement : il te permettra de reprendre sur n\'importe quel appareil (depuis la page d\'accueil).';
    }
    else if (a === 'pdf') { try { makePdf(); } catch (err) { const m = document.getElementById('pdfmsg'); if (m) m.textContent = 'Erreur pendant la création du PDF : ' + (err && err.message ? err.message : err); } }
  });
  app.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('input[data-answer]')) return;
    e.preventDefault();
    if (N.screen === 'quiz') quizSubmit(); else if (N.screen === 'train' && N.run.phase === 'ask') trainSubmit();
  });
}

/* ---------- mode démo (?demo) : parcours fictif pour tester le PDF ---------- */
function simulate(q, good) {
  const input = q.kind === 'qcm' ? (good ? q.correct : (q.correct + 1) % q.options.length)
    : q.kind === 'int' ? String(good ? q.answer : q.answer + 1)
    : (good ? (q.unit ? q.answerText.slice(0, q.answerText.length - q.unit.length).trim() : q.answerText) : '1');
  return record(q, grade(q, input));
}
function buildDemo() {
  const t0 = now() - 3600e3;
  const D = R.freshNotion();
  const diagItems = buildTest().map((q, i) => simulate(q, i % 3 === 0));
  D.diag = { t: t0, items: diagItems, pct: pctOf(diagItems) };
  KEYS.filter(k => diagItems.some(x => x.theme === k && !x.ok)).forEach((k, j) => {
    const items = []; let lvl = 1;
    for (let i = 0; i < SERIES; i++) { const ok = i !== 1; items.push(simulate(NOT.gen[k](lvl), ok)); if (ok) lvl = Math.min(3, lvl + 1); }
    D.train[k] = [{ t: t0 + (j + 1) * 60e3, ok: items.filter(x => x.ok).length, n: SERIES, items }];
  });
  [0.6, 0.9].forEach((rate, a) => {
    const items = buildTest().map((q, i) => simulate(q, (i * 7 % 10) / 10 < rate));
    D.finals.push({ t: t0 + (20 + a) * 60e3, items, pct: pctOf(items) });
  });
  D.screen = 'report';
  return D;
}

/* ---------- démarrage ---------- */
function message(html) { document.getElementById('app').innerHTML = '<div class="card">' + html + '</div>'; }
function lancer(id, notion) {
  ID = id; NOT = notion; T = NOT.themes; KEYS = Object.keys(T);
  DEMO = R.param('demo') !== null;
  STORE = DEMO ? R.DEMO_KEY : R.KEY;
  app = document.getElementById('app');
  ALL = R.load(STORE);
  if (DEMO && !ALL.student) ALL.student = { nom: 'Démo', prenom: 'Professeur' };
  if (!ALL.student) { location.replace('index.html?n=' + encodeURIComponent(id)); return; }
  N = Object.assign(R.freshNotion(), ALL.notions[id] || {});
  if (DEMO && !N.finals.length) N = buildDemo();
  if (DEMO) { const b = document.createElement('div'); b.style.cssText = 'background:#fdf2dc;color:#8a5a00;text-align:center;font-weight:700;padding:6px 16px;font-size:.9rem'; b.textContent = 'MODE DÉMO – parcours fictif pour tester le rapport PDF'; document.body.insertBefore(b, document.body.firstChild); }
  // à l'ouverture, on reprend là où l'élève s'était arrêté
  if (!DEMO) N.screen = R.screenFor(N);
  if (N.screen === 'train' && (!N.run || !N.run.q)) N.screen = 'hub';
  if (N.screen === 'quiz' && !N.quiz) N.screen = N.diag ? 'hub' : 'intro';
  document.title = NOT.titre + ' – ' + BRAND;
  document.getElementById('ntitle').textContent = NOT.titre;
  document.getElementById('who').innerHTML = '<span>' + esc(studentName()) + '</span><a href="index.html">← Toutes les notions</a>';
  save(); bind(); render();
}
/* appelé par notion.html : lit ?n=<id>, charge le fichier de la notion puis lance le parcours */
function ouvrirNotion() {
  const id = R.param('n'), entry = R.findNotion(id);
  if (!entry || entry.bientot) { message('<h1>Notion introuvable</h1><p>Cette notion n\'existe pas (ou pas encore).</p><a class="btn" href="index.html">Voir toutes les notions</a>'); return; }
  const go2 = () => window.RPC_NOTIONS && window.RPC_NOTIONS[id] ? lancer(id, window.RPC_NOTIONS[id]) : message('<h1>Erreur</h1><p>Le contenu de cette notion n\'a pas pu être chargé.</p><a class="btn" href="index.html">Retour à l\'accueil</a>');
  if (window.RPC_NOTIONS && window.RPC_NOTIONS[id]) { go2(); return; }
  const s = document.createElement('script');
  s.src = entry.fichier; s.onload = go2;
  s.onerror = () => message('<h1>Erreur de chargement</h1><p>Le fichier de la notion n\'a pas pu être chargé. Vérifie ta connexion puis recharge la page.</p>');
  document.head.appendChild(s);
}
window.RPC.ouvrirNotion = ouvrirNotion;
})();
