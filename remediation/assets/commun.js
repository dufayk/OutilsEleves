/* =====================================================================
   Remédiation Physique Chimie – fonctions communes (index + notions)
   État enregistré : { v, student:{nom,prenom}, notions:{ [id]: état de la notion } }
   ===================================================================== */
(function (root) {
'use strict';
const APP = 'rpc-remediation';
const KEY = 'rpc-remediation-v1';
const DEMO_KEY = 'rpc-remediation-demo';
const OLD_CS_KEY = 'cs-remediation-v1';          // ancien outil « Chiffres significatifs » seul
const OLD_CS_ID = 'chiffres-significatifs';

function store() { try { const t = '__t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage; } catch (e) { try { return sessionStorage; } catch (e2) { return null; } } }
const ST = store();

function fresh() { return { v: 1, student: null, notions: {} }; }
function freshNotion() { return { screen: 'intro', diag: null, quiz: null, train: {}, run: null, finals: [], fiche: null }; }

function screenFor(n) { return n.quiz ? 'quiz' : (n.finals && n.finals.length) ? 'finalResult' : n.diag ? 'hub' : 'intro'; }
function convertOldCS(st) {
  const n = Object.assign(freshNotion(), { diag: st.diag || null, quiz: st.quiz || null, train: st.train || {}, run: st.run || null, finals: st.finals || [], fiche: st.fiche || null });
  n.screen = screenFor(n);
  const s = fresh();
  s.student = { nom: st.student.nom, prenom: st.student.prenom };
  s.notions[OLD_CS_ID] = n;
  return s;
}
function valid(s) { return s && typeof s === 'object' && s.notions && typeof s.notions === 'object'; }

function load(key) {
  key = key || KEY;
  try {
    const raw = ST && ST.getItem(key);
    if (raw) { const s = JSON.parse(raw); if (valid(s)) return Object.assign(fresh(), s); }
    if (key === KEY) {                               // reprise de l'ancien outil, une seule fois
      const old = ST && ST.getItem(OLD_CS_KEY);
      if (old) { const o = JSON.parse(old); if (o && o.student && o.student.nom) { const s = convertOldCS(o); save(s); return s; } }
    }
  } catch (e) { }
  return fresh();
}
function save(s, key) { try { if (ST) ST.setItem(key || KEY, JSON.stringify(s)); } catch (e) { } }
function wipe(key) { try { if (ST) { ST.removeItem(key || KEY); if (!key || key === KEY) ST.removeItem(OLD_CS_KEY); } } catch (e) { } }

/* ---------- fichier de sauvegarde ---------- */
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function safeName(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9-]+/g, '_'); }
function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  return url;
}
function exportState(s) {
  const name = 'Progression-remediation-PC_' + safeName(s.student.nom) + '_' + safeName(s.student.prenom) + '.json';
  downloadBlob(name, new Blob([JSON.stringify({ app: APP, v: 1, savedAt: new Date().toISOString(), state: s })], { type: 'application/json' }));
  return name;
}
function fromSaveFile(o) {
  if (o && o.app === APP && valid(o.state) && o.state.student) return Object.assign(fresh(), o.state);
  if (o && o.app === 'cs-remediation' && o.state && o.state.student) return convertOldCS(o.state);  // ancien fichier
  return null;
}
function readFile(file, cb) {
  const fr = new FileReader();
  fr.onload = () => { let s = null; try { s = fromSaveFile(JSON.parse(fr.result)); } catch (e) { } cb(s ? null : 'Ce fichier n\'est pas une sauvegarde valide de cet outil.', s); };
  fr.onerror = () => cb('Impossible de lire ce fichier.');
  fr.readAsText(file);
}

/* ---------- résumés ---------- */
function pctOf(items) { return items.length ? Math.round(100 * items.filter(x => x.ok).length / items.length) : 0; }
function cls(p) { return p >= 80 ? 'ok' : p >= 50 ? 'mid' : 'ko'; }
/* état court d'une notion pour le menu */
function notionSummary(n) {
  if (!n || (!n.diag && !n.quiz)) return { code: 'na', label: 'Pas commencé', cta: 'Commencer' };
  if (n.finals && n.finals.length) { const best = Math.max(...n.finals.map(f => f.pct)); return { code: cls(best), label: 'Test final : ' + best + ' %', cta: 'Continuer' }; }
  if (n.diag) return { code: 'mid', label: 'Diagnostic : ' + n.diag.pct + ' % · remédiation', cta: 'Continuer' };
  return { code: 'mid', label: 'Diagnostic en cours', cta: 'Continuer' };
}
function param(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
function findNotion(id) { return (root.RPC_CATALOGUE || []).find(n => n.id === id) || null; }

root.RPC = Object.assign(root.RPC || {}, { KEY, DEMO_KEY, fresh, freshNotion, screenFor, load, save, wipe, esc, safeName, downloadBlob, exportState, readFile, pctOf, cls, notionSummary, param, findNotion });
})(window);
