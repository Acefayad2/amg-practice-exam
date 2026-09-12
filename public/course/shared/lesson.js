(() => {
  'use strict';
  const data = window.AMG_LESSON, total = data.questions.length;
  const key = 'amg-life-lesson-' + data.id + '-v' + data.version;
  const $ = id => document.getElementById(id);
  const blank = () => ({answers:Array(total).fill(null), firstAnswers:Array(total).fill(null), attempts:Array(total).fill(0), videoEnded:false, transcriptRead:false, complete:false, position:0, completedAt:null});
  const valid = (a,i) => Number.isInteger(a) && a >= 0 && a < data.questions[i].options.length;
  // Shuffle presentation only; stored answers continue to use the original option indices.
  const choiceOrders = data.questions.map(question => {
    let seed = 2166136261;
    const identity = data.id + '|' + question.id + '|' + question.prompt;
    for (let i = 0; i < identity.length; i += 1) seed = Math.imul(seed ^ identity.charCodeAt(i), 16777619);
    const order = question.options.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) {
      seed += 0x6D2B79F5;
      let random = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      random ^= random + Math.imul(random ^ (random >>> 7), 61 | random);
      const j = Math.floor(((random ^ (random >>> 14)) >>> 0) / 4294967296 * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });
  let state = blank(), storageAvailable = true, current = 0, returnFocus = null;
  const contentReady = () => state.videoEnded || state.transcriptRead;
  const mastered = () => state.answers.every((a,i) => a === data.questions[i].answer);
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && ['answers','firstAnswers','attempts'].every(k => Array.isArray(saved[k]) && saved[k].length === total)) {
      state.videoEnded = saved.videoEnded === true;
      state.transcriptRead = saved.transcriptRead === true;
      state.position = Number.isFinite(saved.position) && saved.position >= 0 ? saved.position : 0;
      state.completedAt = typeof saved.completedAt === "string" ? saved.completedAt : null;
      if (contentReady()) {
        state.answers = saved.answers.map((a,i) => valid(a,i) ? a : null);
        state.firstAnswers = saved.firstAnswers.map((a,i) => valid(a,i) ? a : null);
        state.attempts = saved.attempts.map(a => Number.isSafeInteger(a) && a > 0 ? a : 0);
        state.complete = saved.complete === true && mastered();
      }
    }
  } catch (_) { state = blank(); }
  try { localStorage.setItem(key + '-probe','1'); localStorage.removeItem(key + '-probe'); }
  catch (_) { storageAvailable = false; }
  function save() {
    try { localStorage.setItem(key,JSON.stringify(state)); } catch (_) { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? 'Progress is saved in this browser.' : 'Storage is unavailable. Keep this page open to retain progress.';
  }
  function el(tag,text,className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  const video = $('scenario-video'), dialog = $('lesson-check');
  if (data.video) video.src = data.video;
  if (data.poster) video.poster = data.poster;
  const track = document.createElement('track');
  Object.assign(track,{kind:'captions',label:'English',srclang:'en',src:'scene-captions.vtt',default:true});
  video.append(track);
  const smallPlayer = window.matchMedia('(max-width: 740px)');
  let captionsEnabled = true, nativeFullscreen = false;
  function updateInlineCaptions() {
    const cues = [...(track.track.activeCues || [])];
    $('inline-caption-text').textContent = cues.length ? cues.map(cue => cue.text).join(' ') : '\u00a0';
    $('inline-caption-text').hidden = !captionsEnabled;
    $('toggle-inline-captions').textContent = captionsEnabled ? 'Hide captions' : 'Show captions';
    $('toggle-inline-captions').setAttribute('aria-pressed', String(captionsEnabled));
  }
  function syncCaptionPlacement() {
    const inline = smallPlayer.matches && !document.fullscreenElement && !nativeFullscreen;
    $('inline-captions').hidden = !inline;
    track.track.mode = inline ? 'hidden' : (captionsEnabled ? 'showing' : 'disabled');
    updateInlineCaptions();
  }
  track.addEventListener('load', syncCaptionPlacement);
  track.track.addEventListener('cuechange', updateInlineCaptions);
  video.textTracks.addEventListener('change', () => {
    if (!smallPlayer.matches || document.fullscreenElement || nativeFullscreen) return;
    if (track.track.mode === 'showing' || track.track.mode === 'disabled') {
      captionsEnabled = track.track.mode === 'showing';
      syncCaptionPlacement();
    }
  });
  smallPlayer.addEventListener('change', syncCaptionPlacement);
  document.addEventListener('fullscreenchange', syncCaptionPlacement);
  video.addEventListener('webkitbeginfullscreen', () => { nativeFullscreen = true; syncCaptionPlacement(); });
  video.addEventListener('webkitendfullscreen', () => { nativeFullscreen = false; syncCaptionPlacement(); });
  $('toggle-inline-captions').addEventListener('click', () => { captionsEnabled = !captionsEnabled; syncCaptionPlacement(); });
  syncCaptionPlacement();
  video.addEventListener('error',() => { $('video-error').hidden = false; });
  video.addEventListener('loadeddata',() => { $('video-error').hidden = true; });
  $('retry-video').addEventListener('click',() => video.load());
  $('transcript').textContent = data.transcript;
  function update() {
    const correct = state.answers.filter((a,i) => a === data.questions[i].answer).length;
    const first = state.firstAnswers.filter((a,i) => a === data.questions[i].answer).length;
    const answered = state.firstAnswers.filter(a => a !== null).length;
    $('lesson-progress').max = total; $('lesson-progress').value = correct;
    $('progress-label').textContent = correct + ' of ' + total + ' questions understood';
    $('watch-status').textContent = contentReady() ? (state.videoEnded ? 'Video finished' : 'Transcript study recorded') + ' · Lesson questions unlocked' : 'Watch the lesson, or study the full transcript, then complete the required questions.';
    $('open-check').disabled = !contentReady();
    $('open-check').textContent = state.complete ? 'Review lesson answers' : (answered ? 'Continue lesson questions' : 'Open lesson questions');
    $('result').textContent = contentReady() ? correct + ' of ' + total + ' questions correct after review. First answers: ' + first + ' of ' + answered + '.' : 'Finish the video or transcript study to unlock the ' + total + ' lesson questions.';
    $('complete').disabled = !contentReady() || !mastered() || state.complete;
    $('complete').textContent = state.complete ? 'Lesson finished' : 'Finish this lesson';
    $('completion-status').textContent = state.complete ? 'Part ' + data.number + ' is complete. Continue to the next lesson when you are ready.' : 'Answer every question correctly, using the explanations and retries as needed, to finish Part ' + data.number + '.';
    $('next-lesson').hidden = !state.complete; $('next-locked').hidden = state.complete;
    save();
  }
  function finish() {
    if (!contentReady() || !mastered()) return;
    state.complete = true; state.completedAt ||= new Date().toISOString(); update();
    returnFocus = $('completion-status');
    if (dialog.open) dialog.close();
    $('completion-status').focus();
  }
  function renderCheck() {
    const box = $('check-content'); box.replaceChildren();
    $('check-heading').textContent = 'Question ' + (current + 1) + ' of ' + total;
    $('check-progress').textContent = state.answers.filter((a,i) => a === data.questions[i].answer).length + ' of ' + total + ' correct after review';
    const question = data.questions[current], selected = state.answers[current], order = choiceOrders[current];
    const fieldset = el('fieldset'); fieldset.append(el('legend',question.prompt));
    const options = el('div',undefined,'options');
    order.forEach((index,displayIndex) => {
      const option = question.options[index];
      const label = el('label',undefined,'option'), input = document.createElement('input');
      Object.assign(input,{type:'radio',name:'lesson-answer',value:String(index),checked:selected === index,disabled:selected !== null});
      label.append(input,el('span',String.fromCharCode(65 + displayIndex) + '. ' + option));
      if (selected !== null && index === question.answer) label.classList.add('correct');
      options.append(label);
    });
    fieldset.append(options); box.append(fieldset);
    const actions = el('div',undefined,'check-actions');
    if (selected === null) {
      const check = el('button','Check answer','primary'); check.disabled = true; check.type = 'button';
      options.addEventListener('change',() => { check.disabled = false; });
      check.addEventListener('click',() => {
        const input = options.querySelector('input:checked'); if (!input || !contentReady()) return;
        const answer = Number(input.value);
        if (state.firstAnswers[current] === null) state.firstAnswers[current] = answer;
        state.answers[current] = answer; state.attempts[current] += 1;
        update(); renderCheck(); $('check-feedback').focus();
      }); actions.append(check);
    } else {
      const correct = selected === question.answer;
      const feedback = el('div',undefined,'feedback'); feedback.id = 'check-feedback'; feedback.tabIndex = -1;
      feedback.append(el('h3',correct ? 'Correct.' : 'Review, then try again.'),el('p',question.explanations[selected]));
      const list = el('ul',undefined,'explanations');
      order.forEach((index,displayIndex) => {
        const item = el('li'); item.append(el('strong',String.fromCharCode(65 + displayIndex) + '. ' + question.options[index] + ' '),document.createTextNode(question.explanations[index])); list.append(item);
      });
      feedback.append(list);
      const review = el('a','Revisit the explanation in the lesson'); review.href = '#' + (typeof question.review === 'number' ? 'section-' + question.review : question.review);
      review.addEventListener('click',() => dialog.close()); feedback.append(review); box.append(feedback);
      if (!correct) {
        const retry = el('button','Try this question again','primary'); retry.type = 'button';
        retry.addEventListener('click',() => { state.answers[current] = null; update(); renderCheck(); box.querySelector('input').focus(); }); actions.append(retry);
      } else if (current < total - 1) {
        const next = el('button','Next question','primary'); next.type = 'button';
        next.addEventListener('click',() => { current += 1; renderCheck(); $('check-heading').focus(); }); actions.append(next);
      } else if (mastered()) {
        const done = el('button',state.complete ? 'Close answer review' : 'Finish Part ' + data.number,'primary'); done.type = 'button';
        done.addEventListener('click',() => state.complete ? dialog.close() : finish()); actions.append(done);
      } else {
        const missing = el('button','Return to unfinished questions','primary');
        missing.addEventListener('click',() => { current = state.answers.findIndex((a,i) => a !== data.questions[i].answer); renderCheck(); $('check-heading').focus(); }); actions.append(missing);
      }
    }
    if (current > 0) {
      const back = el('button','Previous question'); back.type = 'button';
      back.addEventListener('click',() => { current -= 1; renderCheck(); $('check-heading').focus(); }); actions.append(back);
    }
    box.append(actions);
  }
  async function openCheck() {
    if (!contentReady()) return;
    video.pause();
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (_) {} }
    if (video.webkitDisplayingFullscreen && video.webkitExitFullscreen) video.webkitExitFullscreen();
    returnFocus = document.activeElement;
    current = state.answers.findIndex((a,i) => a !== data.questions[i].answer);
    if (current < 0) current = state.complete ? 0 : total - 1;
    renderCheck(); if (!dialog.open) dialog.showModal(); $('check-heading').focus();
  }
  let lastPositionSave = 0;
  video.addEventListener('loadedmetadata', () => {
    if (!state.videoEnded && state.position > 0 && state.position < video.duration - 2) video.currentTime = state.position;
  });
  video.addEventListener('timeupdate', () => {
    if (Date.now() - lastPositionSave < 5000) return;
    lastPositionSave = Date.now(); state.position = video.currentTime; save();
  });
  video.addEventListener('ended',() => { state.videoEnded = true; update(); if (!state.complete) openCheck(); });
  $('open-check').addEventListener('click',openCheck);
  $('transcript-ready').addEventListener('click', () => { state.transcriptRead = true; update(); openCheck(); });
  const savePosition = () => { if (Number.isFinite(video.currentTime)) { state.position = video.currentTime; save(); } };
  video.addEventListener('pause',savePosition);
  window.addEventListener('pagehide',savePosition);
  $('close-check').addEventListener('click',() => dialog.close());
  dialog.addEventListener('close',() => {
    const target = returnFocus && returnFocus !== document.body ? returnFocus : $('open-check');
    target.focus({preventScroll:true});
  });
  $('complete').addEventListener('click',finish);
  $('restart').addEventListener('click',() => {
    const ended = state.videoEnded, read = state.transcriptRead; state = blank(); state.videoEnded = ended; state.transcriptRead = read; update(); if (contentReady()) openCheck();
  });
  update();
})();
