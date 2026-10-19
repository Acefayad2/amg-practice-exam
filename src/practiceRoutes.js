export const PRACTICE_ROUTES = Object.freeze({
  home: '/',
  health: '/health/',
  healthGuide: '/Accident%20%26%20Health%20Study%20Guide.docx',
  lifeCourse: '/course/',
  lifeExams: '/course/assessments/',
  lifeGuide: '/Life%20Producer%20Study%20Guide.docx',
  login: '/login/',
})

const LOGIN_CALLBACK = /(?:access_token|confirmation_token|recovery_token|invite_token|email_change_token)=/

export function routeForLocation(pathname, hash = '') {
  if (LOGIN_CALLBACK.test(hash)) return 'login-callback'
  if (pathname === '/health' || pathname === PRACTICE_ROUTES.health) return 'health'
  return 'home'
}
