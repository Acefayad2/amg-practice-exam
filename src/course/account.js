import { getUser, logout, onAuthChange } from '@netlify/identity';

// The server authenticates every request. Local records are only this user's cache.
const SESSION_KEY = 'amg-account-session-change';
const logicalKey = key => /^amg-life-lesson-(0[1-9]|[1-5]\d|60)-v[1-9]\d*$/.test(key) || key === 'amg-life-assessments-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key,item[key]])) : item);
const same = (a,b) => stable(a) === stable(b);
const listeners = new Set(), memory = new Map(), timers = new Map(), uploading = new Set(), controllers = new Set(), failures = new Map();
let user = null, observedUserId = null, epoch = 0, hydrated = false, stopped = false, conflicted = false, localAvailable = true, reporting = null, reportTimer = null;
let prefix = '', guard = null, queuedSnapshots = 0;
const loginUrl = () => '/login/?next=' + encodeURIComponent(location.pathname + location.search + location.hash);
const lockKey = key => prefix + key;
const withLock = (key, fn) => navigator.locks?.request ? navigator.locks.request(key,fn) : Promise.resolve().then(fn);
const validRecord = record => record && Number.isSafeInteger(record.revision) && record.revision >= 0 && record.value && typeof record.value === 'object' && !Array.isArray(record.value);
const canWrite = () => hydrated && !stopped && !conflicted;
function notify(key = null, source = 'status') { queueMicrotask(() => { for (const fn of listeners) fn({key,source}); renderStatus(); }); }
function statusText() {
  if (stopped) return 'Sign in to continue.';
  if (conflicted) return 'Progress changed on another device. Reload saved progress to continue.';
  if (!hydrated) return 'Loading your saved progress…';
  if (queuedSnapshots) return 'Saving progress to your account…';
  if (failures.size) return localAvailable ? 'Saved on this device. Account sync is pending.' : 'Account sync is pending. Keep this page open.';
  if ([...memory.values()].some(record => record.dirty)) return localAvailable ? 'Saving progress to your account…' : 'Saving progress. Keep this page open until saved.';
  if (reporting?.status === 'pending' || reporting?.status === 'not_configured') return 'Progress saved to your account. Coordinator reporting is pending.';
  return 'Progress saved to your account.';
}
function renderStatus() {
  const slot = document.getElementById('account-sync-status');
  if (!slot) return;
  slot.replaceChildren(document.createTextNode(statusText()));
  slot.setAttribute('role','status');
  if (!stopped && !conflicted && (failures.size || reporting?.status === 'pending' || reporting?.status === 'not_configured')) {
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Retry sync';
    retry.addEventListener('click',() => { flushAll(); syncReport(); }); slot.append(' ',retry);
  }
}
function showGuard(message, actions = []) {
  if (!guard) {
    guard = document.createElement('div'); guard.id = 'account-access-guard'; guard.setAttribute('role','alert');
    Object.assign(guard.style,{position:'fixed',inset:'0',zIndex:'2147483647',background:'#f5f5f2',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'});
    document.body.append(guard);
  }
  guard.replaceChildren(); const panel = document.createElement('div'); panel.style.maxWidth = '430px';
  const title = document.createElement('h1'); title.textContent = 'AMG Learning'; title.style.fontSize = '28px';
  const text = document.createElement('p'); text.textContent = message; panel.append(title,text);
  for (const [label, action] of actions) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.style.marginRight = '8px'; button.addEventListener('click',action); panel.append(button); }
  guard.append(panel);
  for (const media of document.querySelectorAll('video,audio')) media.pause();
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  // Blocking pointer and keyboard interaction prevents an old account's open forms from saving.
  for (const child of document.body.children) if (child !== guard && child.tagName !== 'SCRIPT') child.inert = true;
}
function hideGuard() { document.body.classList.remove('account-loading'); for (const child of document.body.children) if (child !== guard) child.inert = false; guard?.remove(); guard = null; }
function stop(message = 'Your session changed. Sign in again to continue.') {
  if (stopped) return;
  stopped = true; epoch += 1; clearTimeout(reportTimer);
  for (const timer of timers.values()) clearTimeout(timer); timers.clear();
  for (const controller of controllers) controller.abort();
  showGuard(message,[['Sign in',() => location.replace(loginUrl())]]); notify();
}
function broadcast(type) {
  const event = {type,userId:user?.id || null,id:crypto.randomUUID()};
  try { localStorage.setItem(SESSION_KEY,JSON.stringify(event)); } catch (_) { /* SDK also announces session changes. */ }
}
async function signOut() {
  stop('Signing out…'); broadcast('logout');
  try { await logout(); } catch (_) { /* The SDK clears browser auth even when its remote request fails. */ }
  location.replace(loginUrl());
}
function readEnvelope(key) {
  if (localAvailable) {
    try {
      const raw = localStorage.getItem(lockKey(key));
      if (raw === null) { memory.delete(key); return null; }
      const record = JSON.parse(raw);
      if (record?.userId === user.id && validRecord(record)) { memory.set(key,record); return record; }
      return memory.get(key) || null;
    } catch (_) { localAvailable = false; }
  }
  return memory.get(key) || null;
}
function writeEnvelope(key,record) {
  memory.set(key,record);
  if (localAvailable) try { localStorage.setItem(lockKey(key),JSON.stringify(record)); } catch (_) { localAvailable = false; }
}
function markConflict(key,pendingValue) {
  const record = readEnvelope(key); if (record) writeEnvelope(key,{...record,conflict:true,...(pendingValue ? {rejectedValue:clone(pendingValue)} : {})});
  conflicted = true; clearTimeout(reportTimer);
  for (const timer of timers.values()) clearTimeout(timer); timers.clear();
  showGuard('Progress changed on another device. Your pending work is kept on this device until you reload. Reload saved progress to continue.',[['Reload saved progress',() => location.reload()],['Sign out',signOut]]); notify();
}
async function request(path,options = {},stamp = epoch) {
  const controller = new AbortController(); controllers.add(controller);
  const timeout = setTimeout(() => controller.abort(),15000);
  try {
    const response = await fetch(path,{...options,credentials:'include',cache:'no-store',signal:controller.signal});
    if (stamp !== epoch || stopped) throw new Error('account_changed');
    return response;
  } finally { clearTimeout(timeout); controllers.delete(controller); }
}
function schedule(key,delay = 350) {
  if (!canWrite()) return;
  clearTimeout(timers.get(key)); timers.set(key,setTimeout(() => { timers.delete(key); flush(key); },delay));
}
function planReport() {
  clearTimeout(reportTimer);
  if (canWrite() && reporting?.status === 'pending') reportTimer = setTimeout(syncReport,Math.max(35000,Number.isFinite(reporting.retryAfterMs) ? reporting.retryAfterMs : 0));
}
async function syncReport() {
  if (!canWrite()) return;
  const stamp = epoch, uid = user.id;
  try {
    const response = await request('/api/learning',{method:'POST',headers:{'Content-Type':'application/json','X-AMG-User':uid},body:JSON.stringify({action:'sync-report'})},stamp);
    if (response.status === 401 || response.status === 403) { stop(); return; }
    if (!response.ok) throw new Error('report_pending');
    const result = await response.json(); if (stamp !== epoch || stopped || uid !== user.id) return;
    reporting = result.reporting || reporting;
  } catch (_) { /* Account records remain saved; the reporting retry is separate. */ }
  notify(); planReport();
}
async function flush(key) {
  if (!canWrite() || uploading.has(key)) return;
  uploading.add(key); const stamp = epoch, uid = user.id;
  try {
    await withLock(lockKey('sync:' + key),async () => {
      if (!canWrite() || stamp !== epoch) return;
      let sent;
      await withLock(lockKey(key),() => {
        const record = readEnvelope(key); if (!record?.dirty || record.conflict) return;
        sent = record.inflight || {key,value:clone(record.value),revision:record.revision,mutationId:crypto.randomUUID()};
        writeEnvelope(key,{...record,inflight:sent});
      });
      if (!sent || !canWrite() || stamp !== epoch) return;
      const response = await request('/api/learning',{method:'POST',headers:{'Content-Type':'application/json','X-AMG-User':uid},body:JSON.stringify(sent)},stamp);
      if (response.status === 401 || response.status === 403) { stop(); return; }
      if (response.status === 409) { await withLock(lockKey(key),() => markConflict(key)); return; }
      if (!response.ok) throw new Error('sync_pending');
      const result = await response.json(); if (stamp !== epoch || stopped || uid !== user.id) return;
      if (!validRecord(result.record) || result.record.revision <= sent.revision || !same(result.record.value,sent.value)) { await withLock(lockKey(key),() => markConflict(key)); return; }
      await withLock(lockKey(key),() => {
        if (!canWrite() || stamp !== epoch) return;
        const latest = readEnvelope(key); if (latest?.inflight?.mutationId !== sent.mutationId) return;
        const dirty = !same(latest.value,result.record.value);
        writeEnvelope(key,{...latest,revision:result.record.revision,dirty,inflight:null,conflict:false});
        if (dirty) schedule(key);
      });
      failures.delete(key); reporting = result.reporting || reporting; planReport();
    });
  } catch (_) {
    if (canWrite() && stamp === epoch) { const failuresSoFar = (failures.get(key) || 0) + 1; failures.set(key,failuresSoFar); schedule(key,Math.min(30000,2000 * 2 ** Math.min(failuresSoFar,4))); }
  } finally { uploading.delete(key); notify(); }
}
function flushAll() { for (const [key,record] of memory) if (record.dirty) schedule(key,0); }
const storage = {
  getItem(key) {
    if (!canWrite()) throw new Error('account_unavailable');
    if (key.endsWith('-probe')) return null;
    if (!logicalKey(key)) throw new Error('invalid_progress_key');
    const record = readEnvelope(key); return record ? JSON.stringify(record.value) : null;
  },
  setItem(key,text) {
    if (!canWrite()) throw new Error('account_unavailable');
    if (key.endsWith('-probe')) return;
    if (!logicalKey(key)) throw new Error('invalid_progress_key');
    const value = JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_progress_record');
    const previous = readEnvelope(key);
    if (previous && same(previous.value,value)) return;
    writeEnvelope(key,{userId:user.id,value,revision:previous?.revision || 0,dirty:true,inflight:previous?.inflight || null,conflict:false});
    failures.delete(key); schedule(key); notify(key,'local');
  },
  removeItem(key) { if (!key.endsWith('-probe')) throw new Error('progress_deletion_requires_explicit_action'); }
};
async function commitSnapshot(key,text,expectedText) {
  if (!canWrite()) return false;
  queuedSnapshots += 1; notify();
  try { return await withLock(lockKey(key),() => {
    if (!canWrite()) return false;
    const value=JSON.parse(text),expected=expectedText===null?null:JSON.parse(expectedText),latest=readEnvelope(key);
    if (!same(latest?.value || null,expected)) { markConflict(key,value); return false; }
    storage.setItem(key,text); return true;
  }); } finally { queuedSnapshots -= 1; notify(); }
}
const account = {storage,commitSnapshot,lockKey,canWrite,statusText,subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },get user() { return user; },ready:null};
window.AMG_ACCOUNT = account;
async function hydrate() {
  const stamp = epoch;
  showGuard('Loading your account and saved progress…');
  try {
    const browserUser=await getUser(); if (browserUser?.id) observedUserId=browserUser.id;
    if (stamp !== epoch || stopped) return null;
    const response = await request('/api/learning',{},stamp);
    if (response.status === 401) { location.replace(loginUrl()); return null; }
    if (response.status === 403) throw new Error('account_access');
    if (!response.ok) throw new Error('load_failed');
    const result = await response.json();
    if (stamp !== epoch || stopped) return null;
    if (!result.user?.id || typeof result.user.id !== 'string' || !result.records || typeof result.records !== 'object') throw new Error('invalid_account');
    if (observedUserId && observedUserId !== result.user.id) { stop(); return null; }
    user = result.user; prefix = 'amg-user:' + encodeURIComponent(user.id) + ':';
    const keys = new Set(Object.keys(result.records).filter(logicalKey));
    if (localAvailable) try { for (let i=0;i<localStorage.length;i++) { const key=localStorage.key(i); if (key?.startsWith(prefix) && logicalKey(key.slice(prefix.length))) keys.add(key.slice(prefix.length)); } } catch (_) { localAvailable=false; }
    for (const key of keys) await withLock(lockKey(key),() => {
      const remote = result.records[key]; if (remote && !validRecord(remote)) throw new Error('invalid_record');
      const cached = readEnvelope(key), revision = remote?.revision || 0;
      // A reload after a reported conflict deliberately takes the server's saved record.
      if (cached && !cached.conflict && cached.revision > revision) { memory.set(key,cached); }
      else if (cached?.dirty && !cached.conflict) {
        if (remote && same(cached.value,remote.value)) writeEnvelope(key,{userId:user.id,...remote,dirty:false,inflight:null,conflict:false});
        else if (cached.revision === revision || cached.inflight) memory.set(key,cached);
        else { writeEnvelope(key,{...cached,conflict:true}); conflicted = true; }
      } else if (remote) writeEnvelope(key,{userId:user.id,...remote,dirty:false,inflight:null,conflict:false});
      else if (cached) { memory.delete(key); if (localAvailable) try { localStorage.removeItem(lockKey(key)); } catch (_) { localAvailable=false; } }
    });
    if (stamp !== epoch || stopped) return null;
    reporting = result.reporting || null; hydrated = true;
    const controls = document.getElementById('account-controls');
    if (controls) {
      const label = document.createElement('span'); label.textContent = user.name || user.email || 'Your account';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Sign out'; button.addEventListener('click',signOut); controls.replaceChildren(label,button);
    }
    broadcast('active');
    if (conflicted) { const key=[...memory].find(([,r]) => r.conflict)?.[0]; if (key) markConflict(key); return null; }
    hideGuard(); renderStatus(); flushAll(); planReport();
    // Old unscoped records stay untouched. A shared browser does not prove their owner.
    return account;
  } catch (_) {
    if (stamp !== epoch || stopped) return null;
    showGuard('We couldn’t load your saved account. Please try again.',[['Try again',() => location.reload()],['Sign in',() => location.replace(loginUrl())]]);
    return null;
  }
}
onAuthChange((event,nextUser) => { if (nextUser?.id) observedUserId=nextUser.id; if (event === 'logout' || (user && nextUser?.id && nextUser.id !== user.id)) stop(); });
window.addEventListener('storage',event => {
  if (event.key === SESSION_KEY) {
    try { const change=JSON.parse(event.newValue); if (change?.type === 'logout' || (user && change?.userId && change.userId !== user.id)) stop(); } catch (_) { /* Ignore malformed session notices. */ }
    return;
  }
  if (!hydrated || stopped || !event.key?.startsWith(prefix)) return;
  const key = event.key.slice(prefix.length); if (!logicalKey(key)) return;
  const record = readEnvelope(key); if (record?.conflict) { markConflict(key); return; }
  if (record?.dirty) schedule(key);
  let before=null; try { before=JSON.parse(event.oldValue)?.value || null; } catch (_) { /* A removed cache record has no prior value. */ }
  notify(same(before,record?.value || null)?null:key,'external');
});
window.addEventListener('online',() => { flushAll(); syncReport(); });
window.addEventListener('pageshow',event => { if (event.persisted) location.reload(); });
window.addEventListener('pagehide',flushAll);
account.ready = hydrate();
