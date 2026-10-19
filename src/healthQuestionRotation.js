const ROTATION_STEP = 17

export function healthQuestionsForAttempt(questions, attemptNumber) {
  if (questions.length < 2) return [...questions]
  const attempt = Number.isSafeInteger(attemptNumber) && attemptNumber >= 0 ? attemptNumber : 0
  const offset = ((attempt + 1) * ROTATION_STEP) % questions.length
  return [...questions.slice(offset), ...questions.slice(0, offset)]
}
