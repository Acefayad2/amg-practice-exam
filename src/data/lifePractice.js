import { lifeQuestions } from './lifeQuestions';
import { lifeQuestionAudit, lifeSections } from './lifeAudit';

export const lifePracticeQuestions = lifeQuestions
  .filter(q => lifeQuestionAudit[q.n].status !== 'held')
  .map(q => ({ ...q, subsection: lifeQuestionAudit[q.n].subsection,
    topic: lifeSections.find(s => s.id === lifeQuestionAudit[q.n].section)?.title || 'Supplemental' }));
