import type { UserValidateEvent } from '@netlify/functions';
import policy from '../shared/identity-policy.ts';

// Supported filename dispatch also works with CLI versions that omit typed subscriptions.
export default {
  userValidate(event: UserValidateEvent) { return policy.userValidate(event); }
};
