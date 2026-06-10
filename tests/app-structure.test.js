import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

assert.match(source, /const REQUIRED_SELECTORS = \{/, 'app.js defines the required selector map');
assert.match(source, /let elements = \{\};/, 'app.js initializes the elements binding before init');
assert.match(source, /function collectElements\(\)/, 'app.js collects DOM elements during initialization');
assert.match(source, /function assertRequiredElements\(\)/, 'app.js validates required DOM elements');

for (const selector of [
  '#textInput',
  '#charCount',
  '#voiceSelect',
  '#rateValue',
  '#pitchValue',
  '#volumeValue',
  '#playButton',
  '#pauseButton',
  '#stopButton',
  '#status',
]) {
  assert.ok(source.includes(selector), `${selector} is included in required selectors`);
}

assert.match(source, /let voices = \[\];/, 'voice state is initialized before populateVoices');
assert.match(source, /let chunks = \[\];/, 'chunk state is initialized before updateProgress/playback');
assert.match(source, /document\.readyState === 'loading'/, 'init waits for DOMContentLoaded when needed');
assert.match(source, /function updateLabels\(\)/, 'label updater remains available for init and input events');

console.log('app structure tests passed');
