// Run with playwright-cli run-code --filename scripts/qa/lesson-cross-tab.js
// Uses a new isolated context; blocks remote media. Serve PRIMARY/public at 4197.
async page => {
  const origin = 'http://127.0.0.1:4197', url = origin + '/course/lesson-03/';
  const context = await page.context().browser().newContext();
  const checks = [], errors = [];
  const check = (ok, name) => { if (!ok) throw Error(name); checks.push(name); };
  await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const create = async ({stale = false, noLocks = false, writeFailure = false} = {}) => {
    const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(({stale, noLocks, writeFailure}) => {
      if (stale) window.addEventListener('storage', e => e.stopImmediatePropagation(), true);
      if (noLocks) Object.defineProperty(navigator, 'locks', {value: undefined});
      if (writeFailure) {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key.startsWith('amg-life-lesson-')) throw new DOMException('QA write unavailable', 'QuotaExceededError');
          return original.call(this, key, value);
        };
      }
    }, {stale, noLocks, writeFailure});
    await p.goto(url); return p;
  };
  const settle = async p => p.evaluate(async () => {
    const d = window.AMG_LESSON, k = 'amg-life-lesson-' + d.id + '-v' + d.version;
    if (navigator.locks) await navigator.locks.request(k, () => {});
  });
  const openTranscript = async p => {
    await p.locator('details').filter({has: p.locator('#transcript')}).locator('summary').click();
    await p.locator('#transcript-ready').click(); await p.locator('#lesson-check').waitFor({state: 'visible'});
  };
  const answer = async (p, value) => {
    await p.locator('input[name="lesson-answer"][value="' + value + '"]').check();
    await p.getByRole('button', {name: 'Check answer', exact: true}).click();
    await p.locator('#check-feedback').waitFor();
  };
  const history = s => JSON.stringify({practiceAttemptId:s.practiceAttemptId, answers:s.answers, firstAnswers:s.firstAnswers, firstAnswerAt:s.firstAnswerAt, attempts:s.attempts, complete:s.complete, completedAt:s.completedAt});
  try {
    const a = await create(); await settle(a);
    const data = await a.evaluate(() => window.AMG_LESSON), key = 'amg-life-lesson-' + data.id + '-v' + data.version;
    const read = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const b = await create({stale:true}), observer = await create(); await settle(b);
    const initial = await read(a), wrong = (data.questions[0].answer + 1) % data.questions[0].options.length;
    check(initial.firstAnswerAt.every(x => x === null), 'Opening lesson does not invent first-answer times');
    await openTranscript(a); await answer(a, wrong);
    const first = await read(a), firstTime = first.firstAnswerAt[0];
    check(Number.isFinite(Date.parse(firstTime)), 'Actual first Check answer records an ISO timestamp');
    check(first.attempts[0] === 1 && first.firstAnswers[0] === wrong, 'First mistake recorded once');
    await a.getByRole('button', {name:'Try this question again', exact:true}).click();
    for (let i=0;i<data.questions.length;i++) {
      await answer(a, data.questions[i].answer);
      if (i < data.questions.length-1) await a.getByRole('button',{name:'Next question',exact:true}).click();
    }
    const beforeFinish = await read(a);
    check(beforeFinish.complete === false, 'Correct answers alone require explicit Finish');
    await a.getByRole('button',{name:'Finish Part 3',exact:true}).click(); await settle(a);
    const completed = await read(a);
    check(completed.complete && completed.answers.every((x,i)=>x===data.questions[i].answer), 'Full actual eight-question attempt finishes');
    check(completed.firstAnswerAt[0] === firstTime && completed.attempts[0] === 2 && completed.firstAnswers[0] === wrong, 'Retry preserves timestamp, first mistake and retry count');
    check(completed.practiceAttemptId === initial.practiceAttemptId, 'Attempt identity stays stable through completion');
    await observer.waitForFunction(() => document.getElementById('completion-status').textContent.includes('is complete'));
    check(true, 'Normal peer updates completion through storage events');
    await openTranscript(b); await settle(b);
    check(history(await read(a)) === history(completed), 'Forced-stale transcript action cannot erase completion/history');
    await b.evaluate(() => { document.getElementById('scenario-video').dispatchEvent(new Event('pause')); window.dispatchEvent(new Event('pagehide')); });
    await settle(b);
    check(history(await read(a)) === history(completed), 'Forced-stale pause and pagehide retain completion/history');
    const staleFinish = await create({stale:true}); await settle(staleFinish);
    await a.locator('#restart').click(); await a.locator('#lesson-check').waitFor({state:'visible'}); await settle(a);
    const restarted = await read(a);
    check(restarted.practiceAttemptId !== completed.practiceAttemptId && restarted.transcriptRead, 'Explicit Restart creates new attempt and retains studied-content prerequisite');
    check(!restarted.complete && restarted.completedAt === null && restarted.answers.every(x=>x===null) && restarted.firstAnswers.every(x=>x===null) && restarted.firstAnswerAt.every(x=>x===null) && restarted.attempts.every(x=>x===0), 'Restart clears answer and first-mistake history');
    await staleFinish.evaluate(() => {
      document.getElementById('complete').dispatchEvent(new Event('click'));
      document.getElementById('scenario-video').dispatchEvent(new Event('pause'));
      window.dispatchEvent(new Event('pagehide'));
    });
    await settle(staleFinish);
    check(history(await read(a)) === history(restarted), 'Old completed tab cannot resurrect completion with Finish/pause/pagehide');
    await observer.waitForFunction(() => !document.getElementById('completion-status').textContent.includes('is complete'));
    check(true, 'Normal peer sees explicit Restart without reload');
    await answer(a, wrong); const newFirst = await read(a);
    check(newFirst.practiceAttemptId === restarted.practiceAttemptId && Date.parse(newFirst.firstAnswerAt[0]) >= Date.parse(firstTime) && newFirst.attempts[0] === 1, 'New attempt records a new actual first answer');
    for (const p of [a,b,observer,staleFinish]) await p.close();

    // Pause followed immediately by real navigation checks persistence before document teardown.
    const navigation = await create(); await settle(navigation);
    await Promise.all([
      navigation.waitForURL(origin + '/course/'),
      navigation.evaluate(() => {
        document.getElementById('scenario-video').currentTime = 73.25;
        document.getElementById('scenario-video').dispatchEvent(new Event('pause'));
        location.href = '/course/';
      })
    ]);
    await navigation.goto(url); await settle(navigation);
    check((await read(navigation)).position === 73.25, 'Immediate pause and actual navigation retain the latest resume position in this browser');
    await navigation.close();

    // Legacy seed is a real schema fixture, not fabricated new event history.
    const seed = await create(); await settle(seed);
    const legacy = {...completed}; delete legacy.practiceAttemptId; delete legacy.firstAnswerAt;
    await seed.evaluate(({key,legacy})=>localStorage.setItem(key,JSON.stringify(legacy)),{key,legacy});
    await seed.close(); const migrated = await create(); await settle(migrated);
    const restored = await read(migrated);
    check(restored.practiceAttemptId === 'legacy:' + key && restored.firstAnswerAt.every(x=>x===null), 'Legacy migration uses stable ID and unknown timestamps');
    check(restored.complete && JSON.stringify(restored.answers)===JSON.stringify(legacy.answers) && JSON.stringify(restored.firstAnswers)===JSON.stringify(legacy.firstAnswers) && JSON.stringify(restored.attempts)===JSON.stringify(legacy.attempts) && restored.completedAt===legacy.completedAt, 'Legacy completion and original option-index history survive without version reset');
    await migrated.close();

    // Force two first-answer actions to queue behind the same live Web Lock.
    const racingA = await create(), racingB = await create({stale:true});
    await racingA.locator('#restart').click(); await racingA.locator('#lesson-check').waitFor({state:'visible'});
    await racingB.locator('#open-check').click(); await racingB.locator('#lesson-check').waitFor({state:'visible'});
    const locker = await create(); await settle(locker);
    await racingA.locator('input[name="lesson-answer"][value="' + wrong + '"]').check();
    await racingB.locator('input[name="lesson-answer"][value="' + data.questions[0].answer + '"]').check();
    await locker.evaluate(k => {
      navigator.locks.request(k, async () => {
        window.qaLockHeld = true; await new Promise(resolve => { window.qaReleaseLock = resolve; });
      });
    }, key);
    await locker.waitForFunction(()=>window.qaLockHeld);
    await racingA.getByRole('button',{name:'Check answer',exact:true}).click();
    await racingB.getByRole('button',{name:'Check answer',exact:true}).click();
    await locker.evaluate(()=>window.qaReleaseLock()); await settle(racingA); await settle(racingB);
    const raced = await read(racingA);
    check(raced.answers[0] === wrong && raced.firstAnswers[0] === wrong && raced.attempts[0] === 1, 'Concurrent queued first-answer clicks preserve the first committed answer exactly once');
    check(Number.isFinite(Date.parse(raced.firstAnswerAt[0])), 'Concurrent answer retains one real first-answer timestamp');
    await racingA.close(); await racingB.close(); await locker.close();

    // Sequential stale-save fallback on browsers lacking Web Locks; not an atomic-race guarantee.
    const fallbackA = await create({noLocks:true}), fallbackB = await create({noLocks:true,stale:true});
    await fallbackA.locator('#restart').click(); await fallbackA.locator('#lesson-check').waitFor({state:'visible'});
    const fallbackRestart = await read(fallbackA);
    await fallbackB.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    check(history(await read(fallbackA))===history(fallbackRestart), 'No-Web-Locks sequential stale pagehide cannot undo explicit Restart');
    await fallbackA.close(); await fallbackB.close();

    // Disk remains readable but all lesson writes fail; old disk answers must not overwrite memory.
    const storageSeed = await create(); await settle(storageSeed);
    const partial = await read(storageSeed); await storageSeed.close();
    const blocked = await create({writeFailure:true}); await blocked.locator('#open-check').click();
    await blocked.locator('#lesson-check').waitFor({state:'visible'});
    await answer(blocked,data.questions[0].answer);
    await blocked.getByRole('button',{name:'Next question',exact:true}).click();
    await answer(blocked,data.questions[1].answer);
    check((await blocked.locator('#progress-label').textContent()).startsWith('2 of '), 'Readable old disk + blocked writes retains consecutive in-memory answers');
    check((await blocked.locator('#save-status').textContent()).includes('Storage is unavailable'), 'Storage failure honestly reports in-memory progress only');
    check(history(await read(blocked))===history(partial), 'Write-blocked page leaves existing disk record unchanged');
    await blocked.close();
    check(errors.length===0,'No JavaScript runtime errors in targeted flows');
    return {reviewedAt:new Date().toISOString(),origin,checks,errors,scope:'Actual Part3 question controls with a first miss and corrected retry; forced-stale storage-event suppression tests rebase independently of event delivery. Synthetic pause/pagehide/Finish events exercise handlers; they do not claim real browser-close persistence. Explicit legacy and write-failure fixtures. Remote media requests blocked. Isolated context closed after test.',limitations:'Web Locks supplies same-origin live-tab transaction serialization when supported. Fallback protects sequential stale saves but not truly simultaneous cross-process writes. Unavailable storage stays in memory until reload; unload position save remains best effort. No cross-device/account synchronization.'};
  } finally { await context.close(); }
}
