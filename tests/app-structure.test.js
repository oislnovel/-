import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

assert.match(source, /const elements = \{/, 'app.js defines the elements lookup object');
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
  assert.ok(source.includes(`document.querySelector('${selector}')`), `${selector} is queried into elements`);
}

assert.match(source, /let voices = \[\];/, 'voice state is initialized before populateVoices');
assert.match(source, /let chunks = \[\];/, 'chunk state is initialized before updateProgress/playback');
assert.match(source, /function updateLabels\(\)/, 'label updater remains available for init and input events');

console.log('app structure tests passed');
