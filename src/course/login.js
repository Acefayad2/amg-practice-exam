// Only internal learning routes may be a post-entry destination.
export function sanitizeReturnTo(value, origin) {
  const fallback = '/course/';
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = new URL(origin), target = new URL(value, base.origin);
    const path = decodeURIComponent(target.pathname);
    if (target.origin !== base.origin || target.username || target.password || !['https:','http:'].includes(target.protocol)) return fallback;
    if (/[\\%\u0000-\u001f\u007f]/.test(path) || path.split('/').includes('..')) return fallback;
    if (path !== '/' && path !== '/course' && !path.startsWith('/course/')) return fallback;
    if (/(?:access|refresh|confirmation|recovery|invite|email_change)_token=/i.test(target.hash)) return fallback;
    return target.pathname + target.search + target.hash;
  } catch (_) { return fallback; }
}

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const next = sanitizeReturnTo(params.get('next') || params.get('returnTo'), location.origin);
const SESSION_KEY = 'amg-account-session-change';
let busy = false, epoch = 0;
const copy = {
  code: ['Welcome to AMG', 'Enter your team’s access code.'],
  profile: ['Make it yours', 'Enter your own name and email to track your progress.']
};
function broadcast(type,userId = null) {
  try { localStorage.setItem(SESSION_KEY,JSON.stringify({type,userId,id:crypto.randomUUID()})); } catch (_) { /* The server still verifies the learner session. */ }
}
function clearError() { $('auth-error').hidden = true; $('auth-error').textContent = ''; }
function showError(message) { $('auth-error').textContent = message; $('auth-error').hidden = false; $('auth-error').focus(); }
function setBusy(value) {
  busy = value; $('auth-card').setAttribute('aria-busy',String(value));
  $('auth-card').querySelectorAll('button,input').forEach(control => { control.disabled = value; });
}
function showPanel(stage,focus = true) {
  if (!copy[stage]) throw new Error('invalid_stage');
  $('auth-card').querySelectorAll('[data-auth-panel]').forEach(panel => { panel.hidden = panel.dataset.authPanel !== stage; });
  $('auth-loading').hidden = true; $('auth-retry').hidden = true;
  $('auth-title').textContent = copy[stage][0]; $('auth-intro').textContent = copy[stage][1];
  clearError(); if (focus) $(stage === 'code' ? 'access-code' : 'learner-name').focus();
}
async function access(body) {
  const stamp = epoch, controller = new AbortController(), timeout = setTimeout(() => controller.abort(),15000);
  try {
    const response = await fetch('/api/access',{...(body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {}),credentials:'include',cache:'no-store',signal:controller.signal});
    if (stamp !== epoch) return null;
    // Platform throttling may return an HTML/text response before the function runs.
    if (response.status === 429) { const error = new Error('access_failed'); error.code = 'rate_limited'; throw error; }
    const result = await response.json();
    if (stamp !== epoch) return null;
    if (!response.ok) { const error = new Error('access_failed'); error.code = result.error; throw error; }
    if (!['code','profile','ready'].includes(result.stage)) throw new Error('invalid_stage');
    return result;
  } finally { clearTimeout(timeout); }
}
function enter(result) {
  if (result.stage !== 'ready' || typeof result.user?.id !== 'string' || !result.user.id) throw new Error('invalid_learner');
  broadcast('active',result.user.id); location.replace(next);
}
function errorMessage(error) {
  if (error.code === 'code_invalid') return 'That code doesn’t match. Try again or ask your coordinator.';
  if (error.code === 'gate_required') return 'Your access code step expired. Enter the code again.';
  if (error.code === 'invalid_profile') return 'Enter your full name and a valid email address.';
  if (error.code === 'rate_limited') return 'Too many attempts. Wait a moment and try again.';
  return 'We couldn’t connect. Please try again.';
}
$('code-form').addEventListener('submit',async event => {
  event.preventDefault(); if (busy || !$('code-form').reportValidity()) return;
  clearError(); setBusy(true);
  try {
    const result = await access({action:'code',code:$('access-code').value});
    if (!result) return;
    if (result.stage !== 'profile') throw new Error('invalid_stage');
    $('access-code').value = ''; $('access-code').type = 'password'; $('toggle-code').textContent = 'Show'; $('toggle-code').setAttribute('aria-pressed','false');
    broadcast('logout'); showPanel('profile');
  } catch (error) { showError(errorMessage(error)); }
  finally { setBusy(false); if (!$('profile-form').hidden) $('learner-name').focus(); }
});
$('profile-form').addEventListener('submit',async event => {
  event.preventDefault(); if (busy || !$('profile-form').reportValidity()) return;
  clearError(); setBusy(true);
  try {
    const result = await access({action:'start',name:$('learner-name').value.trim().replace(/\s+/g,' '),email:$('learner-email').value.trim().toLowerCase()});
    if (result) enter(result);
  } catch (error) { if (error.code === 'gate_required') showPanel('code'); showError(errorMessage(error)); }
  finally { setBusy(false); }
});
$('change-code').addEventListener('click',async () => {
  if (busy) return; clearError(); setBusy(true);
  try { const result = await access({action:'logout'}); if (result) { broadcast('logout'); $('profile-form').reset(); showPanel('code'); } }
  catch (error) { showError(errorMessage(error)); }
  finally { setBusy(false); if (!$('code-form').hidden) $('access-code').focus(); }
});
$('toggle-code').addEventListener('click',() => {
  const show = $('access-code').type === 'password'; $('access-code').type = show ? 'text' : 'password';
  $('toggle-code').textContent = show ? 'Hide' : 'Show'; $('toggle-code').setAttribute('aria-pressed',String(show));
});
$('auth-retry').addEventListener('click',() => location.reload());
window.addEventListener('storage',event => {
  if (event.key !== SESSION_KEY) return;
  try { const change = JSON.parse(event.newValue); if (['active','logout'].includes(change?.type)) { epoch += 1; location.reload(); } } catch (_) { /* Ignore malformed notices. */ }
});
window.addEventListener('pageshow',event => { if (event.persisted) location.reload(); });
async function initialize() {
  setBusy(true);
  try { const result = await access(); if (result) { if (result.stage === 'ready') enter(result); else showPanel(result.stage,false); } }
  catch (error) { $('auth-loading').hidden = true; $('auth-retry').hidden = false; showError(errorMessage(error)); }
  finally { setBusy(false); }
}
initialize();
