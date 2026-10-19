export const PRACTICE_ROUTES = Object.freeze({
  home: '/',
  health: '/health/',
  healthGuide: '/Accident%20%26%20Health%20Study%20Guide.docx',
  lifeCourse: '/course/',
  lifeExams: '/course/assessments/',
  lifeGuide: '/Life%20Producer%20Study%20Guide.docx',
  login: '/login/',
})

const MOUNTED_BASE = '/practice'

export function practiceRoutesFor(pathname = '/') {
  const mounted = pathname === MOUNTED_BASE || pathname.startsWith(MOUNTED_BASE + '/')
  if (!mounted) return PRACTICE_ROUTES
  return Object.freeze({
    ...PRACTICE_ROUTES,
    home: MOUNTED_BASE + '/',
    health: MOUNTED_BASE + '/health/',
    healthGuide: '/guides/accident-health.docx',
    lifeGuide: '/guides/life-producer.docx',
  })
}

const LOGIN_CALLBACK = /(?:access_token|confirmation_token|recovery_token|invite_token|email_change_token)=/

export function routeForLocation(pathname, hash = '') {
  if (LOGIN_CALLBACK.test(hash)) return 'login-callback'
  if (/^\/(?:practice\/)?health\/?$/.test(pathname)) return 'health'
  return 'home'
}
