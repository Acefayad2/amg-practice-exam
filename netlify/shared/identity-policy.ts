import type { UserValidateEvent, UserSignupEvent, UserModifiedEvent } from '@netlify/functions';
import { timingSafeEqual } from 'node:crypto';

const allowedRole = 'amg-agent';
function validCode(value: unknown) {
  const expected = Netlify.env.get('AMG_REGISTRATION_CODE');
  if (!expected || typeof value !== 'string') return false;
  const entered = Buffer.from(value), required = Buffer.from(expected);
  return entered.length === required.length && timingSafeEqual(entered, required);
}
function cleanedUser(user: UserValidateEvent['user'], grant = false) {
  const metadata = { ...user.userMetadata };
  delete metadata.amg_access_code;
  const roles = new Set(user.appMetadata?.roles as string[] || []);
  if (grant) roles.add(allowedRole);
  // The Netlify event codec serializes top-level roles after appMetadata.roles.
  // Keep both representations aligned so an incoming roles: [] cannot undo a grant.
  return { ...user, roles: [...roles], userMetadata: metadata, appMetadata: { ...user.appMetadata, roles: [...roles] } };
}

export default {
  userValidate(event: UserValidateEvent) {
    const name = event.user.userMetadata?.full_name;
    if (typeof name !== 'string' || !name.trim() || name.length > 120 || !validCode(event.user.userMetadata?.amg_access_code)) return event.deny();
    return { user: cleanedUser(event.user, true) };
  },
  userSignup(event: UserSignupEvent) {
    if (!event.user.appMetadata?.roles || !(event.user.appMetadata.roles as string[]).includes(allowedRole)) return event.deny();
    return { user: cleanedUser(event.user) };
  },
  userModified(event: UserModifiedEvent) {
    return { user: cleanedUser(event.user) };
  }
};
