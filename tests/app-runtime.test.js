import { strict as assert } from 'node:assert';

const selectors = new Map();

function makeElement(selector) {
  return {
    selector,
    value: selector === '#rate' || selector === '#pitch' || selector === '#volume' ? '1' : '',
    textContent: '',
    innerHTML: '',
    dataset: {},
    listeners: {},
    append(child) {
      this.children ??= [];
      this.children.push(child);
      if (selector === '#voiceSelect' && !this.value) this.value = child.value;
    },
    addEventListener(type, listener) {
      this.listeners[type] ??= [];
      this.listeners[type].push(listener);
    },
  };
}

globalThis.document = {
  querySelector(selector) {
    if (!selectors.has(selector)) selectors.set(selector, makeElement(selector));
    return selectors.get(selector);
  },
  createElement(tagName) {
    return makeElement(tagName);
  },
  addEventListener() {},
};

globalThis.localStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.get(key) ?? null;
  },
  setItem(key, value) {
    this.store.set(key, String(value));
  },
  removeItem(key) {
    this.store.delete(key);
  },
};

globalThis.window = globalThis;
globalThis.speechSynthesis = {
  getVoices() {
    return [
      { name: 'Microsoft David', lang: 'en-US', voiceURI: 'david' },
      { name: 'Microsoft Ayumi', lang: 'ja-JP', voiceURI: 'ayumi', default: true },
    ];
  },
  addEventListener() {},
  cancel() {},
  speak() {},
};

await import('../src/app.js');

const textInput = selectors.get('#textInput');
const charCount = selectors.get('#charCount');
const voiceSelect = selectors.get('#voiceSelect');

assert.equal(charCount.textContent, '0文字');
assert.ok(
  voiceSelect.children.some((option) => option.textContent.includes('Microsoft Ayumi')),
  'Japanese voices such as Microsoft Ayumi are rendered in the voice dropdown',
);

textInput.value = '貼り付けテスト';
textInput.listeners.input[0]();
assert.equal(charCount.textContent, '7文字');

console.log('app runtime tests passed');
