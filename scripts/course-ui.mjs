import {curriculum as lifeCurriculum} from '../docs/course/full-course/curriculum.mjs';
import {curriculum as healthCurriculum} from '../docs/course/health/curriculum.mjs';

// A track is one course served under /course/. Life is the original; Health shares every runtime file.
export const LIFE_TRACK = {
 id:'life', base:'/course/', assessments:'/course/assessments/', coverage:'/course/coverage/',
 program:'Maryland Life', label:'AMG Life', keyPrefix:'amg-life-lesson-', curriculum:lifeCurriculum,
 searchHint:'Try a topic like “beneficiary” or “annuity”.',
 scope:'Life-only scope', switch:{href:'/course/health/', label:'Health course'}
};
export const HEALTH_TRACK = {
 id:'health', base:'/course/health/', assessments:'/course/health/assessments/', coverage:null,
 program:'Maryland Accident & Health', label:'AMG Health', keyPrefix:'amg-health-lesson-', curriculum:healthCurriculum,
 searchHint:'Try a topic like “deductible” or “Medicare”.',
 scope:'Accident and health scope', switch:{href:'/course/', label:'Life course'}
};

export function icon(name, className = '') {
 const paths = {
  play:'<path d="m9 5 11 7-11 7Z"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book:'<path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  test:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  swap:'<path d="M7 8h12m-4-4 4 4-4 4M17 16H5m4 4-4-4 4-4"/>'
 };
 return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

export function courseHeader(active = 'course', track = LIFE_TRACK) {
 return `<header class="app-header"><div class="app-header-inner"><a class="brand" href="${track.base}" aria-label="AMG Learning home"><span class="brand-mark"><img src="/course/assets/amg-mark.webp" alt="" width="68" height="64"></span><span class="brand-wordmark">AMG<span>Learning</span></span></a><nav class="app-nav" aria-label="Main navigation"><a href="${track.base}"${active === 'course' ? ' aria-current="page"' : ''}>${icon('book')}<span>Course</span></a><a href="${track.assessments}"${active === 'assessments' ? ' aria-current="page"' : ''}>${icon('test')}<span>${track.id==='health'?'Mock exams':'Practice tests'}</span></a><a href="${track.switch.href}" class="track-switch">${icon('swap')}<span>${track.switch.label}</span></a></nav><div id="account-controls" class="account-controls"></div></div></header><div id="account-sync-status" class="account-sync-status" role="status" aria-live="polite"></div>`;
}

export function courseFooter(track = LIFE_TRACK) {
 return `<footer class="app-footer"><span>AMG Learning <span class="footer-dot">·</span> ${track.program}</span>${track.coverage ? `<a href="${track.coverage}">Coordinator review ${icon('arrow')}</a>` : `<a href="${track.switch.href}">${track.switch.label} ${icon('arrow')}</a>`}</footer>`;
}
