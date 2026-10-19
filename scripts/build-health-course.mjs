import fs from 'node:fs';
import { healthQuestions } from '../src/data/healthQuestions.js';
import { courseHeader, courseFooter, icon } from './course-ui.mjs';

const directory = 'public/course/health';
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(directory + '/health-data.js', 'window.AMG_HEALTH_QUESTIONS=' + JSON.stringify(healthQuestions).replaceAll('<','\\u003c') + ';\n');
fs.writeFileSync(directory + '/index.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Protected AMG Maryland Accident and Health or Sickness study portal."><title>Health &amp; Sickness · AMG Learning</title><link rel="icon" href="/course/assets/amg-mark.webp"><link rel="stylesheet" href="/course/shared/app.css"><link rel="stylesheet" href="/course/shared/account.css"><script src="/course/shared/account.js" defer></script><link rel="stylesheet" href="health.css"><script src="health-data.js" defer></script><script src="health.js" defer></script></head>
<body class="account-loading"><a class="skip" href="#health-app">Skip to Health &amp; Sickness</a>${courseHeader('health')}
<main class="health-main"><div id="health-app"><p>Loading Health &amp; Sickness…</p></div>
<noscript>Enable JavaScript to use the Health &amp; Sickness practice test.</noscript>
<details class="health-about"><summary>About this practice material</summary><p>AMG study material for Maryland Accident &amp; Health or Sickness producer preparation. It is not an official exam, licensing decision, or guarantee of passing.</p><p>The current Health video course is not published. The existing 90-question practice test and study guide remain available here.</p></details>
${courseFooter('Maryland Health &amp; Sickness','/Accident%20%26%20Health%20Study%20Guide.docx','Protected study guide')}</main></body></html>\n`);
console.log(JSON.stringify({ healthQuestions: healthQuestions.length, output: directory }));
