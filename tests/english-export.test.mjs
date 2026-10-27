import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseCSV } from '../scripts/data.mjs';

test('the English CSV translates labels without changing player identities, numbers or missing values', () => {
  const source = parseCSV(fs.readFileSync(path.join(ROOT, 'data/csv/world-cup-cohort.csv'), 'utf8'));
  const translated = parseCSV(fs.readFileSync(path.join(ROOT, 'data/csv/world-cup-cohort.en.csv'), 'utf8'));
  const asRecords = ([headers, ...rows]) => rows.map(row => Object.fromEntries(headers.map((key, i) => [key, row[i]])));
  const original = asRecords(source);
  const english = asRecords(translated);
  assert.equal(english.length, 12);
  for (let i = 0; i < english.length; i++) {
    for (const key of ['name', 'countryCode', 'rank', 'goals', 'assists', 'minutes', 'shots', 'xg', 'passAccuracy', 'speed', 'sprints', 'saves']) {
      assert.equal(english[i][key], original[i][key], `${original[i].name}/${key}`);
    }
    assert.ok(['Forward', 'Midfielder', 'Defender', 'Goalkeeper'].includes(english[i].pos));
    assert.doesNotMatch(english[i].country, /\p{Script=Han}/u);
  }
  assert.equal(new Set(english.map(player => player.country)).size, 10);
  assert.equal(english[0].country, 'France');
  assert.equal(english.find(player => player.name === 'Endrick').goals, '');
});
