import type { UserModifiedEvent } from '@netlify/functions';
import policy from '../shared/identity-policy.ts';

export default {
  userModified(event: UserModifiedEvent) { return policy.userModified(event); }
};
