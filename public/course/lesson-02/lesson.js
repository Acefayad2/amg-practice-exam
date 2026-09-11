(() => {
  'use strict';
  const data = window.LESSON02;
  const key = 'amg-life-lesson-02-v' + data.version;
  const $ = id => document.getElementById(id);
  const emptyState = () => ({ answers: Array(data.questions.length).fill(null), complete: false });
  let state = emptyState();
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && Array.isArray(saved.answers) && saved.answers.length === data.questions.length) {
      state.answers = saved.answers.map((answer, i) => Number.isInteger(answer) && answer >= 0 && answer < data.questions[i].options.length ? answer : null);
      state.complete = saved.complete === true && state.answers.every(answer => answer !== null);
    }
  } catch (_) { state = emptyState(); }
  try {
    const probe = key + '-probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch (_) { storageAvailable = false; }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch (_) { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? 'Progress is saved in this browser.' : 'Storage is unavailable. Progress lasts while this page stays open.';
  }
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  const video = $('scenario-video');
  if (data.video) video.src = data.video;
  if (data.poster) video.poster = data.poster;
  video.addEventListener('error', () => { $('video-error').hidden = false; });
  if (!data.video) $('video-error').hidden = false;
  const track = document.createElement('track');
  track.kind = 'captions'; track.label = 'English'; track.srclang = 'en'; track.src = 'scene-captions.vtt'; track.default = true;
  video.append(track);
  $('transcript').textContent = data.transcript;

  function selectTerm(index) {
    const term = data.terms[index];
    [...$('term-buttons').children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    $('term-detail').replaceChildren(el('h3', term.name), el('p', term.definition), el('p', term.example));
  }
  data.terms.forEach((term, index) => {
    const button = el('button', term.name);
    button.type = 'button'; button.setAttribute('aria-controls', 'term-detail');
    button.addEventListener('click', () => selectTerm(index));
    $('term-buttons').append(button);
  });
  selectTerm(0);

  function updateProgress() {
    const count = state.answers.filter(a => a !== null).length;
    const score = state.answers.filter((answer, i) => answer === data.questions[i].answer).length;
    const total = data.questions.length;
    $('lesson-progress').value = count;
    $('progress-label').textContent = `${count} of ${total} answered`;
    $('result').textContent = count === total ? `Practice result: ${score} of ${total} correct.` + (score === total ? ' You applied all eight concepts correctly.' : ' Review the explanations for your missed questions.') : `${count} of ${total} answered · ${score} correct so far.`;
    $('complete').disabled = count !== total || state.complete;
    $('complete').textContent = state.complete ? 'Lesson finished' : 'Finish this lesson';
    $('completion-status').textContent = state.complete ? 'This practice attempt is complete. Your next step is to review this lesson with the coordinator.' : '';
    save();
  }
  function renderQuestion(question, index) {
    const article = el('article', undefined, 'question'); article.id = 'question-' + index;
    const fieldset = document.createElement('fieldset');
    fieldset.append(el('legend', `${index + 1}. ${question.prompt}`));
    const options = el('div', undefined, 'options');
    const selected = state.answers[index];
    question.options.forEach((option, j) => {
      const label = el('label', undefined, 'option');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'question-' + index; input.value = String(j);
      input.checked = selected === j; input.disabled = selected !== null;
      label.append(input, el('span', `${String.fromCharCode(65 + j)}. ${option}`));
      if (selected !== null && j === question.answer) label.classList.add('correct');
      options.append(label);
    });
    fieldset.append(options); article.append(fieldset);
    const feedback = el('div', undefined, 'feedback'); feedback.id = 'feedback-' + index;
    feedback.tabIndex = -1;
    if (selected === null) {
      const check = el('button', 'Check answer', 'primary check'); check.type = 'button'; check.disabled = true;
      options.addEventListener('change', () => { check.disabled = false; });
      check.addEventListener('click', () => {
        const input = options.querySelector('input:checked');
        if (!input) return;
        state.answers[index] = Number(input.value);
        article.replaceWith(renderQuestion(question, index));
        updateProgress();
        $('feedback-' + index).focus({ preventScroll: true });
      });
      article.append(check);
    } else {
      feedback.append(el('h4', selected === question.answer ? 'Correct.' : 'Let’s review this one.'));
      feedback.append(el('p', `You chose ${String.fromCharCode(65 + selected)}. The correct answer is ${String.fromCharCode(65 + question.answer)}.`));
      const list = el('ul', undefined, 'explanations');
      question.options.forEach((option, j) => {
        const item = el('li'); item.append(el('strong', `${String.fromCharCode(65 + j)}. ${option} `), document.createTextNode(question.explanations[j])); list.append(item);
      });
      feedback.append(list);
      const link = el('a', 'Review this concept'); link.href = '#' + question.review; feedback.append(link);
    }
    article.append(feedback);
    return article;
  }
  function renderQuestions() { $('questions').replaceChildren(...data.questions.map(renderQuestion)); }
  $('complete').addEventListener('click', () => {
    if (state.answers.some(answer => answer === null)) return;
    state.complete = true; updateProgress();
  });
  $('restart').addEventListener('click', () => {
    state = emptyState(); renderQuestions(); updateProgress();
    const first = $('question-0').querySelector('input'); first.focus();
  });
  function updatePool() {
    const n = Number($('pool-size').value);
    if (![100, 1000, 10000].includes(n)) return;
    const extra = $('extra-claim').checked ? 1 : 0;
    const expected = n * 0.01;
    const illustrated = expected + extra;
    const rate = illustrated / n * 100;
    const percent = rate.toFixed(2) + '%';
    $('expected-claims').textContent = expected.toLocaleString('en-US');
    $('illustrated-claims').textContent = illustrated.toLocaleString('en-US');
    $('illustrated-rate').textContent = percent;
    $('chart-rate').textContent = percent;
    $('illustrated-bar').style.width = (rate / 2 * 100) + '%';
    $('pool-insight').textContent = extra
      ? 'One extra claim changes this group’s rate by ' + (100 / n).toFixed(2) + ' percentage points. Each person’s assumed probability stays at 1%.'
      : 'This illustration matches the expected count. Real results can be above or below it; matching is not guaranteed.';
    const total = (expected * 100000).toLocaleString('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0});
    $('pool-cost').textContent = 'Expected benefits: ' + total + ' total, or $1,000 per person. The expected amount per person stays the same for all three group sizes.';
  }
  $('pool-size').addEventListener('change', updatePool);
  $('extra-claim').addEventListener('change', updatePool);
  updatePool();
  renderQuestions(); updateProgress();
})();

