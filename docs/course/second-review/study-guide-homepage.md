# Homepage study-time guide

September 13, 2026.

Added a learner-facing study-time section after the homepage's existing course-review notice. It uses the existing paper/ink/teal colors, heading styles and thin dividers, with stacked definition rows on mobile.

- Sustainable source: `scripts/course-home.mjs`, called by `scripts/build-full-course.mjs`.
- Published-file mirror for local review: `public/course/index.html`.
- Scoped responsive styles: `public/course/shared/home.css`.
- Basis: `docs/course/second-review/study-time.md`, rounding the 18.60 / 27.43 / 33.58-hour planning scenarios to about 19 / 27 / 34 hours. The latter two are explicitly cumulative totals.
- Video runtime is calculated from available lesson durations by the homepage renderer, currently about 4 hours 35 minutes. Full-course estimates appear only when all planned lessons are available.
- Schedule: about two hours per study day over three to four weeks, with later review and a separate uninterrupted 1-hour-45-minute reservation per mock.
- Estimates are explicitly distinguished from measured learner averages and approved prelicensing hours. No pass guarantee was added.

Checks completed: source syntax check; renderer-in-memory section matches the public-file section exactly; all 60 lesson entries remain. Local browser measurements at 1280px and 390px report matching document/viewport width, three estimate rows and 60 lesson entries. Both screenshots were visually inspected for legibility, spacing and wrapping.

Screenshots: `output/playwright/second-review/study-guide-1280.png` and `study-guide-390.png`. The isolated `amg-second-study` browser and local port-4187 server were closed after checks.

No full build or deployment was run. Parent coordinates the integrated release. No changes were made to `shared/lesson.js` during this task.
