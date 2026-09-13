import type { UserSignupEvent } from '@netlify/functions';
import policy from '../shared/identity-policy.ts';

export default {
  userSignup(event: UserSignupEvent) { return policy.userSignup(event); }
};
