import assert from 'node:assert/strict';

export function rng(seed) {
  let state = seed;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export function shuffle(values, random) {
  const shuffled = values.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const normalize = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');

export function itemPreparer(lessons, otherStems = []) {
  const lookup = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const stems = new Set([...lessons.flatMap(l => l.questions.map(q => q.prompt)), ...otherStems].map(normalize));
  const ids = new Set();
  function prepare(item, id, domain, scored, random) {
    assert(!ids.has(id), 'Repeat item ID ' + id);
    assert(lookup.has(item.lesson), 'Missing related lesson for ' + id);
    assert(!stems.has(normalize(item.prompt)), 'Repeated question: ' + id);
    assert.equal(item.options.length, 4, id);
    assert.equal(new Set(item.options.map(normalize)).size, 4, 'Duplicate option: ' + id);
    assert(item.options.every(option => option.trim()), id);
    assert(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4, id);
    assert(item.explanation.length > 45, 'Missing explanation: ' + id);
    ids.add(id);
    stems.add(normalize(item.prompt));
    const order = shuffle([0, 1, 2, 3], random);
    return { ...item, id, domain, scored, options: order.map(i => item.options[i]),
      answer: order.indexOf(item.answer), sources: lookup.get(item.lesson).sources || [] };
  }
  return { prepare, ids };
}

// Make every answer position comparably frequent without using a predictable order.
export function balanceAnswers(forms, seed) {
  for (const [index, form] of forms.entries()) {
    const random = rng(seed + index * 3217);
    const positions = shuffle(form.questions.map((_, i) => i % 4), random);
    form.questions = form.questions.map((item, i) => {
      const correct = item.options[item.answer];
      const others = shuffle(item.options.filter((_, j) => j !== item.answer), random);
      const options = Array.from({ length: 4 }, (_, j) => j === positions[i] ? correct : others.shift());
      return { ...item, options, answer: positions[i] };
    });
  }
}

// Keep each added question's answer order stable if another item is inserted before it.
export function prepareRotationExtras(rows, prepare, prefix) {
  return rows.map(({id,domain,source,...item})=>{
    assert(id.startsWith(prefix) && source.url.startsWith('https://'));
    const seed=[...id].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))|0,631);
    const q=prepare(item,id,domain,true,rng(seed));
    return {...q,sources:[source,...q.sources]};
  });
}
