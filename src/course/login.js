import {
  login, signup, logout, getUser, getSettings, handleAuthCallback,
  requestPasswordRecovery, updateUser, acceptInvite, MissingIdentityError
} from '@netlify/identity';

// Only internal learning routes may be a post-login destination.
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
const card = $('auth-card');
let busy = false, signupEnabled = true, resetMode = null, inviteToken = null;
const copy = {
  login: ['Welcome back', 'Sign in to continue your course.'],
  signup: ['Create your account', 'Use your own email and the AMG access code.'],
  forgot: ['Forgot your password?', 'We’ll send a link to help you set a new one.'],
  reset: ['Set a new password', 'Choose a password you’ll use for your AMG account.'],
  success: ['Your AMG account', '']
};
function clearError() { $('auth-error').hidden = true; $('auth-error').textContent = ''; }
function showError(message) {
  $('auth-error').textContent = message;
  $('auth-error').hidden = false;
  $('auth-error').focus();
}
function setBusy(value, submit = null) {
  busy = value; card.setAttribute('aria-busy', String(value));
  card.querySelectorAll('button,input').forEach(control => { control.disabled = value; });
  if (submit) {
    if (value) { submit.dataset.idleLabel = submit.textContent; submit.textContent = submit.dataset.busyLabel || 'Please wait…'; }
    else { submit.textContent = submit.dataset.idleLabel || submit.textContent; delete submit.dataset.idleLabel; }
  }
}
function showPanel(name, focus = true) {
  if (name === 'signup' && !signupEnabled) name = 'login';
  card.querySelectorAll('[data-auth-panel]').forEach(panel => { panel.hidden = panel.dataset.authPanel !== name; });
  $('auth-loading').hidden = true;
  $('auth-tabs').hidden = !['login','signup'].includes(name);
  $('tab-signup').hidden = !signupEnabled;
  for (const tab of ['login','signup']) $('tab-' + tab).setAttribute('aria-pressed', String(tab === name));
  $('auth-title').textContent = copy[name][0]; $('auth-intro').textContent = copy[name][1];
  $('auth-intro').hidden = !copy[name][1];
  clearError();
  if (focus) $('auth-title').focus();
}
function showSuccess({title, message, email, signedIn = false}) {
  showPanel('success', false);
  $('success-title').textContent = title; $('success-message').textContent = message;
  $('success-email').textContent = email || ''; $('success-email').hidden = !email;
  $('success-continue').hidden = !signedIn;
  $('success-sign-in').hidden = signedIn;
  $('use-another-account').hidden = !signedIn;
  $('success-title').focus();
}
function setMode(mode) {
  const url = new URL(location.href);
  if (mode) url.searchParams.set('mode', mode); else url.searchParams.delete('mode');
  // Tokens are exchanged by the SDK; never retain a callback token in a UI URL.
  url.hash = '';
  history.replaceState(null, '', url.pathname + url.search);
}
function clearSensitiveFields() {
  card.querySelectorAll('input[type="password"], input[data-was-password]').forEach(input => {
    input.value = ''; input.type = 'password'; delete input.dataset.wasPassword;
  });
  card.querySelectorAll('[data-password-target]').forEach(button => {
    button.textContent = 'Show'; button.setAttribute('aria-pressed','false');
    button.setAttribute('aria-label',button.getAttribute('aria-label').replace(/^Hide /,'Show '));
  });
}
function messageFor(error, operation) {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (error instanceof MissingIdentityError || error?.status >= 500 || /fetch|network|timeout|unreachable|load failed/i.test(message)) return 'The sign-in service could not be reached. Please try again in a moment.';
  if (error?.status === 429 || /too many|rate limit/i.test(message)) return 'There have been too many attempts. Please wait a few minutes, then try again.';
  if (operation === 'login') {
    if (/confirm.*email|email.*confirm/i.test(message)) return 'Confirm your email using the link in your inbox, then sign in.';
    return 'We couldn’t sign you in. Check your email and password, or use “Forgot password?” below.';
  }
  if (operation === 'signup') {
    if (/already.*(registered|exists)|already been/i.test(message)) return 'An account already uses this email. Sign in or reset your password instead.';
    if (/password/i.test(message)) return 'That password was not accepted. Use at least 12 characters and try a different password.';
    return 'We couldn’t create your account. Check your details and AMG access code, or contact your licensing coordinator.';
  }
  if (operation === 'forgot') return 'We couldn’t request a reset link. Please try again in a moment.';
  if (operation === 'reset') return 'We couldn’t save the password. Try a different password, or request a fresh reset link if this session has expired.';
  return 'We couldn’t complete that request. Please try again.';
}
async function submitForm(form, operation, action) {
  if (busy || !form.reportValidity()) return;
  const submit = form.querySelector('[type="submit"]'); clearError(); setBusy(true, submit);
  try { await action(); }
  catch (error) { showError(messageFor(error, operation)); }
  finally { setBusy(false, submit); }
}

card.querySelectorAll('[data-show-panel]').forEach(button => button.addEventListener('click', () => {
  if (busy) return;
  const panel = button.dataset.showPanel;
  if (panel === 'forgot') $('forgot-email').value = $('login-email').value.trim();
  setMode(null); showPanel(panel);
}));
card.querySelectorAll('[data-password-target]').forEach(button => button.addEventListener('click', () => {
  const input = $(button.dataset.passwordTarget), show = input.type === 'password';
  input.type = show ? 'text' : 'password'; input.dataset.wasPassword = 'true';
  button.textContent = show ? 'Hide' : 'Show'; button.setAttribute('aria-pressed', String(show));
  button.setAttribute('aria-label',button.getAttribute('aria-label').replace(/^(Show|Hide) /,show ? 'Hide ' : 'Show '));
}));
$('login-form').addEventListener('submit', event => {
  event.preventDefault();
  submitForm(event.currentTarget, 'login', async () => {
    await login($('login-email').value.trim(), $('login-password').value);
    clearSensitiveFields(); location.replace(next);
  });
});
$('signup-name').addEventListener('input', () => $('signup-name').setCustomValidity(''));
$('signup-code').addEventListener('input', () => $('signup-code').setCustomValidity(''));
$('signup-form').addEventListener('submit', event => {
  event.preventDefault();
  $('signup-name').setCustomValidity($('signup-name').value.trim() ? '' : 'Enter your full name.');
  $('signup-code').setCustomValidity($('signup-code').value.trim() ? '' : 'Enter the AMG access code.');
  submitForm(event.currentTarget, 'signup', async () => {
    const email = $('signup-email').value.trim();
    const user = await signup(email, $('signup-password').value, {
      full_name: $('signup-name').value.trim(), amg_access_code: $('signup-code').value.trim()
    });
    clearSensitiveFields(); $('login-email').value = email;
    // SDK 2.0.0 exposes confirmedAt; it does not have an emailVerified property.
    const signedIn = Boolean(user.confirmedAt && await getUser());
    showSuccess(signedIn
      ? {title:'Your account is ready',message:'You’re signed in and can continue to your course.',email,signedIn:true}
      : user.confirmedAt
        ? {title:'Your account is ready',message:'Sign in with your email and password to continue.',email}
        : {title:'Check your inbox',message:'Use the confirmation link in the email to activate your account. If you don’t see it, check your spam folder.',email});
  });
});
$('forgot-form').addEventListener('submit', event => {
  event.preventDefault();
  submitForm(event.currentTarget, 'forgot', async () => {
    const email = $('forgot-email').value.trim();
    await requestPasswordRecovery(email);
    showSuccess({title:'Check your inbox',message:'If this address has an AMG account, you’ll receive a password reset link. Check your spam folder if needed.',email});
  });
});
for (const id of ['reset-password','reset-confirm']) $(id).addEventListener('input', () => $('reset-confirm').setCustomValidity(''));
$('reset-form').addEventListener('submit', event => {
  event.preventDefault();
  $('reset-confirm').setCustomValidity($('reset-password').value === $('reset-confirm').value ? '' : 'The passwords do not match.');
  submitForm(event.currentTarget, 'reset', async () => {
    let user;
    if (resetMode === 'invite' && inviteToken) user = await acceptInvite(inviteToken, $('reset-password').value);
    else if (resetMode === 'recovery' && await getUser()) user = await updateUser({password:$('reset-password').value});
    else throw new Error('Password reset session expired');
    inviteToken = null; resetMode = null; clearSensitiveFields(); setMode(null);
    showSuccess({title:'Password saved',message:'Your new password is ready. You can continue to your course.',email:user.email,signedIn:true});
  });
});
$('success-continue').addEventListener('click', () => { if (!busy) location.replace(next); });
$('use-another-account').addEventListener('click', async () => {
  if (busy) return;
  clearError(); setBusy(true);
  try { await logout(); clearSensitiveFields(); resetMode = null; inviteToken = null; setMode(null); showPanel('login'); }
  catch (error) { showError(messageFor(error, 'logout')); }
  finally { setBusy(false); }
});

async function start() {
  setBusy(true);
  try {
    // Process confirmations/recovery before normal existing-session navigation.
    const callback = await handleAuthCallback();
    if (callback?.type === 'recovery') {
      if (!callback.user) throw new Error('Recovery session unavailable');
      resetMode = 'recovery'; setMode('reset'); showPanel('reset'); return;
    }
    if (callback?.type === 'invite') {
      if (!callback.token) throw new Error('Invitation unavailable');
      resetMode = 'invite'; inviteToken = callback.token; setMode('invite'); showPanel('reset');
      $('auth-title').textContent = 'Accept your invitation'; $('auth-intro').textContent = 'Set a password for your AMG account.'; return;
    }
    if (callback) {
      showSuccess({title:callback.type === 'confirmation' ? 'Email confirmed' : callback.type === 'email_change' ? 'Email updated' : 'You’re signed in',message:'Your account is ready. Continue to your AMG course.',email:callback.user?.email,signedIn:Boolean(callback.user)}); return;
    }
    const user = await getUser();
    if (params.get('mode') === 'reset') {
      if (user) { resetMode = 'recovery'; showPanel('reset'); }
      else { showPanel('forgot'); showError('Open the password reset link from your email to choose a new password.'); }
      return;
    }
    if (params.get('mode') === 'invite') {
      showPanel('login'); showError('Reopen your invitation email link to finish setting your password.'); return;
    }
    if (user) {
      showSuccess({title:'You’re signed in',message:'Continue where you left off in your AMG course.',email:user.email,signedIn:true}); return;
    }
    try { signupEnabled = !(await getSettings()).disableSignup; } catch (_) { /* Login remains available while settings are unreachable. */ }
    showPanel(params.get('mode') === 'signup' ? 'signup' : params.get('mode') === 'forgot' ? 'forgot' : 'login', false);
  } catch (_) {
    setMode(null); showPanel('login');
    showError('This account link could not be verified. It may have expired or already been used. Request a new password link, or contact your coordinator for confirmation or invitation help.');
  } finally { setBusy(false); }
}
start();
