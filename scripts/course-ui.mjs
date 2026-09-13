export function icon(name, className = '') {
 const paths = {
  play:'<path d="m9 5 11 7-11 7Z"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book:'<path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  test:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>'
 };
 return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

export function courseHeader(active = 'course') {
 return `<header class="app-header"><div class="app-header-inner"><a class="brand" href="/course/" aria-label="AMG Learning home"><span class="brand-mark"><img src="/course/assets/amg-mark.webp" alt="" width="68" height="64"></span><span class="brand-wordmark">AMG<span>Learning</span></span></a><nav class="app-nav" aria-label="Main navigation"><a href="/course/"${active === 'course' ? ' aria-current="page"' : ''}>${icon('book')}<span>Course</span></a><a href="/course/assessments/"${active === 'assessments' ? ' aria-current="page"' : ''}>${icon('test')}<span>Practice tests</span></a></nav><div id="account-controls" class="account-controls"></div></div></header><div id="account-sync-status" class="account-sync-status" role="status" aria-live="polite"></div>`;
}

export function courseFooter() {
 return `<footer class="app-footer"><span>AMG Learning <span class="footer-dot">·</span> Maryland Life</span><a href="/course/coverage/">Coordinator review ${icon('arrow')}</a></footer>`;
}
