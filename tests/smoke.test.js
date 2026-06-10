import { strict as assert } from 'node:assert';
import { splitIntoSpeechChunks } from '../src/speech.js';

assert.deepEqual(splitIntoSpeechChunks(''), []);
assert.deepEqual(splitIntoSpeechChunks('こんにちは。元気ですか？', 20), ['こんにちは。元気ですか？']);

const chunks = splitIntoSpeechChunks('第一文です。第二文です。第三文です。', 10);
assert.ok(chunks.length > 1, 'long text is split into multiple chunks');
assert.ok(chunks.every((chunk) => chunk.length <= 10), 'chunks respect max length');
assert.equal(chunks.join(''), '第一文です。第二文です。第三文です。');

console.log('smoke tests passed');
