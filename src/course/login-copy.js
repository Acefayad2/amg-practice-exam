// The caller passes the validated internal post-entry destination.
export function loginCopyFor(next) {
  let path
  try { path = decodeURIComponent(next.split(/[?#]/)[0]) } catch { path = '' }
  const health = path === '/course/health' || path.startsWith('/course/health/')
  const life = !health && (path === '/course' || path.startsWith('/course/'))
  if (health) return {
    program: 'Maryland Accident & Health',
    description: 'Accident and health insurance concepts, clear explanations and practice you can return to.',
    meta: 'Enter your AMG team code and continue your Maryland Accident & Health course or mock exam.',
  }
  if (life) return {
    program: 'Maryland Life',
    description: 'Life insurance concepts, clear explanations and practice you can return to.',
    meta: 'Enter your AMG team code and continue your Maryland Life course or mock exam.',
  }
  return {
    program: 'Maryland Licensing',
    description: 'Life and Accident & Health insurance concepts, clear explanations and practice you can return to.',
    meta: 'Enter your AMG team code and continue your Maryland insurance licensing studies.',
  }
}
