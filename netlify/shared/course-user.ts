import { getUser, type User } from '@netlify/identity';

/**
 * Identity2.0.0 prefers its runtime operator token when fetching /user, then
 * falls back to verified JWT claims without confirmedAt. Keep the SDK's verified
 * identity, and hydrate only that same user from the canonical Identity service
 * using the request's actual session cookie. Never upgrade unverified claims.
 */
export async function getCourseUser(request: Request): Promise<User | null> {
  const user = await getUser();
  if (!user?.id) return null;
  if (user.confirmedAt && Number.isFinite(Date.parse(user.confirmedAt))) return user;

  const match = /(?:^|;\s*)nf_jwt=([^;]+)/.exec(request.headers.get('cookie') || '');
  if (!match) return null;
  let token: string;
  try { token = decodeURIComponent(match[1]); } catch { return null; }
  if (!token || token.length > 16384) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('https://amg-exam-portal.netlify.app/.netlify/identity/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > 65536) return null;
    const profile = JSON.parse(text);
    if (!profile || typeof profile !== 'object' || Array.isArray(profile) || profile.id !== user.id) return null;
    if (typeof profile.email !== 'string' || !profile.email || profile.email.length > 320) return null;
    if (typeof profile.confirmed_at !== 'string' || !profile.confirmed_at || !Number.isFinite(Date.parse(profile.confirmed_at))) return null;
    const app = profile.app_metadata && typeof profile.app_metadata === 'object' && !Array.isArray(profile.app_metadata) ? profile.app_metadata : {};
    const metadata = profile.user_metadata && typeof profile.user_metadata === 'object' && !Array.isArray(profile.user_metadata) ? profile.user_metadata : {};
    const name = metadata.full_name ?? metadata.name;
    return {
      ...user,
      id: profile.id,
      email: profile.email,
      confirmedAt: profile.confirmed_at,
      roles: Array.isArray(app.roles) ? app.roles.filter((role: unknown) => typeof role === 'string') : [],
      name: typeof name === 'string' ? name : undefined,
      appMetadata: app,
      userMetadata: metadata,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
