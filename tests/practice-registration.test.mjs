import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const source = fs.readFileSync(new URL('../src/components/RegisterScreen.jsx', import.meta.url), 'utf8');
const executable = transformSync(source, { loader: 'jsx', format: 'cjs', jsxFactory: 'h' }).code;
function fixture() {
  const hooks = [], pendingEffects = [], nodes = new Map(), starts = [];
  let cursor = 0, tree, active = null;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return hooks[i] ||= { current: initial }; },
    useEffect(callback, deps) { const i = cursor++, old = hooks[i]; if (!old || deps.some((value, j) => value !== old[j])) pendingEffects.push(callback); hooks[i] = deps; },
  };
  const module = { exports: {} };
  vm.runInNewContext(executable, { module, exports: module.exports, require: id => { assert.equal(id, 'react'); return react; }, h: (tag, props, ...children) => ({ tag, props: props || {}, children: children.flat(Infinity).filter(x => x !== false && x != null) }) });
  const Component = module.exports.default;
  function all(node = tree) { return node && typeof node === 'object' ? [node, ...node.children.flatMap(all)] : []; }
  function render() {
    cursor = 0;
    tree = Component({ exam: { title: 'Health drill' }, onStart: value => starts.push(value), onBack() {}, mockExamsUrl: '/course/health/assessments/' });
    for (const node of all()) if (node.props.ref) {
      const id = node.props.id;
      if (!nodes.has(id)) nodes.set(id, { focus() { active = id; } });
      node.props.ref.current = nodes.get(id);
    }
    while (pendingEffects.length) pendingEffects.shift()();
  }
  render();
  const input = id => all().find(node => node.tag === 'input' && node.props.id === id);
  return { all, input, starts, get active() { return active; }, submit() { all().find(node => node.tag === 'form').props.onSubmit({ preventDefault() {} }); render(); }, type(id, value) { active = id; input(id).props.onChange({ target: { value } }); render(); } };
}

test('registration inputs have associated labels, required and autocomplete metadata', () => {
  const f = fixture();
  for (const [id, label, complete] of [['practice-name', 'Full Name', 'name'], ['practice-email', 'Email Address', 'email']]) {
    const node = f.input(id);
    assert(node);
    assert.equal(node.props.required, true);
    assert.equal(node.props.autoComplete, complete);
    assert.equal(node.props['aria-invalid'], false);
    assert.equal(node.props['aria-describedby'], undefined);
    assert(f.all().some(n => n.tag === 'label' && n.props.htmlFor === id && n.children.includes(label)));
    assert.equal(node.props.style.outline, undefined);
  }
});

test('blank and repeated submissions focus the first invalid field after errors render', () => {
  const f = fixture();
  for (let n = 0; n < 2; n++) {
    f.submit();
    assert.equal(f.active, 'practice-name');
    for (const id of ['practice-name', 'practice-email']) {
      assert.equal(f.input(id).props['aria-invalid'], true);
      assert.equal(f.input(id).props['aria-describedby'], `${id}-error`);
      assert(f.all().some(node => node.props.id === `${id}-error` && node.props.role === 'alert'));
    }
  }
  assert.equal(f.starts.length, 0);
});

test('editing does not steal focus; invalid email focuses email; corrected submission normalizes data', () => {
  const f = fixture();
  f.submit(); f.type('practice-name', ' Test Learner ');
  assert.equal(f.active, 'practice-name');
  assert.equal(f.input('practice-name').props['aria-invalid'], false);
  f.type('practice-email', 'invalid'); f.submit();
  assert.equal(f.active, 'practice-email');
  assert.equal(f.starts.length, 0);
  f.type('practice-email', ' QA@example.invalid ');
  assert.equal(f.input('practice-email').props['aria-invalid'], false);
  assert.equal(f.input('practice-email').props['aria-describedby'], undefined);
  f.submit();
  assert.deepEqual(JSON.parse(JSON.stringify(f.starts)), [{ name: 'Test Learner', email: 'qa@example.invalid' }]);
});

test('practice inputs retain a visible keyboard focus indicator', () => {
  const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /\.register-card input:focus-visible\s*\{[^}]*outline:3px solid #0d4a39/);
});
