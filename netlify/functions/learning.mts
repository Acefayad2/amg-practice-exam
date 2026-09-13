import type { Config } from '@netlify/functions';
import { getCourseUser } from '../shared/course-user.ts';
import { getStore } from '@netlify/blobs';
import { createLearningHandler } from './_shared/learning-service.mjs';

export default createLearningHandler({
  getUser: getCourseUser,
  getStore: () => getStore({ name: 'amg-learning-v1', consistency: 'strong' }),
  appsScriptURL: () => Netlify.env.get('AMG_APPS_SCRIPT_URL') || '',
  getToken: () => Netlify.context.cookies.get('nf_jwt') || null,
});

export const config: Config = { path: '/api/learning', method: ['GET', 'POST'] };
