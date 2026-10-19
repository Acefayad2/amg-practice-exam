const GUIDE_PATHS = new Set([
  '/Accident & Health Study Guide.docx',
  '/Life Producer Study Guide.docx',
  '/guides/accident-health.docx',
  '/guides/life-producer.docx',
]);

export function sanitizeReturnTo(value, origin) {
  const fallback = '/course/';
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = new URL(origin), target = new URL(value, base.origin);
    const decodedPath = decodeURIComponent(target.pathname);
    if (target.origin !== base.origin || target.username || target.password || !['https:','http:'].includes(target.protocol)) return fallback;
    if (/[\\%\u0000-\u001f\u007f]/.test(decodedPath) || decodedPath.split('/').includes('..')) return fallback;
    let path = decodedPath;
    if (path === '/health' || path === '/health/') path = '/course/health/';
    else if (path === '/practice/health' || path === '/practice/health/') path = '/course/health/';
    else if (path === '/practice' || path === '/practice/') path = '/course/';
    else if (path !== '/' && path !== '/course' && !path.startsWith('/course/') && !GUIDE_PATHS.has(path)) return fallback;
    if (/(?:access|refresh|confirmation|recovery|invite|email_change)_token=/i.test(target.hash)) return fallback;
    const encodedPath = path === decodedPath ? target.pathname : path;
    return encodedPath + target.search + target.hash;
  } catch (_) { return fallback; }
}
