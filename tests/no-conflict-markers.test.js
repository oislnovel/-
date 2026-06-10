import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean)
  .filter((file) => !file.startsWith('.git'));

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  assert.ok(!content.includes('<<<<<<<'), `${file} contains a merge-conflict start marker`);
  assert.ok(!content.includes('======='), `${file} contains a merge-conflict separator marker`);
  assert.ok(!content.includes('>>>>>>>'), `${file} contains a merge-conflict end marker`);
}

console.log('no conflict markers found');
