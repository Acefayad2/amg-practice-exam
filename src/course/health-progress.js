export const HEALTH_PROGRESS_KEY = 'amg-health-assessments-v1';
export const HEALTH_PROGRESS_VERSION = 1;
export const HEALTH_PASS_COUNT = 63;
export const HEALTH_ROTATION_STEP = 17;

export const blankHealthProgress = () => ({ version: HEALTH_PROGRESS_VERSION, attempts: [] });

export function healthQuestionOrder(questions, rotation) {
  if (!questions.length) return [];
  const offset = rotation % questions.length;
  return questions.slice(offset).concat(questions.slice(0, offset));
}

export function createHealthAttempt(state, now = Date.now(), id = crypto.randomUUID(), questionCount = 90) {
  return {
    id,
    rotation: ((state.attempts.length + 1) * HEALTH_ROTATION_STEP) % questionCount,
    startedAt: now,
    submittedAt: null,
    earlyFail: false,
    answers: Array(questionCount).fill(null),
    current: 0,
  };
}

export function scoreHealthAttempt(attempt, questions) {
  return attempt.answers.reduce((total, answer, index) => total + (answer === questions[index].answer ? 1 : 0), 0);
}

export function healthAttemptCannotPass(attempt, questions) {
  const answered = attempt.answers.filter(answer => answer !== null).length;
  return scoreHealthAttempt(attempt, questions) + (questions.length - answered) < HEALTH_PASS_COUNT;
}

export function answerHealthAttempt(attempt, questions, index, answer) {
  if (attempt.submittedAt !== null || attempt.earlyFail || attempt.answers[index] !== null) return false;
  if (!questions[index]?.choices.some(choice => choice[0] === answer)) return false;
  attempt.answers[index] = answer;
  attempt.earlyFail = healthAttemptCannotPass(attempt, questions);
  return true;
}

export function latestOpenHealthAttempt(state) {
  return [...state.attempts].reverse().find(attempt => attempt.submittedAt === null) || null;
}

export function latestSubmittedHealthAttempt(state) {
  return [...state.attempts].reverse().find(attempt => attempt.submittedAt !== null) || null;
}

export function parseHealthProgress(text, questions) {
  try {
    const state=JSON.parse(text);
    if(state?.version!==HEALTH_PROGRESS_VERSION||!Array.isArray(state.attempts)||state.attempts.length>500)return null;
    const ids=new Set(); let open=0;
    for(let index=0;index<state.attempts.length;index++){
      const attempt=state.attempts[index], ordered=healthQuestionOrder(questions,attempt?.rotation||0);
      if(!attempt||Object.keys(attempt).sort().join(',')!=='answers,current,earlyFail,id,rotation,startedAt,submittedAt')return null;
      if(typeof attempt.id!=='string'||!attempt.id||attempt.id.length>160||ids.has(attempt.id))return null;ids.add(attempt.id);
      if(attempt.rotation!==((index+1)*HEALTH_ROTATION_STEP)%questions.length||!Number.isFinite(attempt.startedAt)||attempt.startedAt<=0)return null;
      if(attempt.submittedAt!==null&&(!Number.isFinite(attempt.submittedAt)||attempt.submittedAt<attempt.startedAt))return null;
      if(!Array.isArray(attempt.answers)||attempt.answers.length!==questions.length||!attempt.answers.every((answer,answerIndex)=>answer===null||ordered[answerIndex].choices.some(choice=>choice[0]===answer)))return null;
      if(!Number.isInteger(attempt.current)||attempt.current<0||attempt.current>=questions.length||typeof attempt.earlyFail!=='boolean'||attempt.earlyFail!==healthAttemptCannotPass(attempt,ordered))return null;
      if(attempt.submittedAt===null){open++;if(index!==state.attempts.length-1)return null;}
    }
    return open<=1?state:null;
  } catch (_) { return null; }
}
