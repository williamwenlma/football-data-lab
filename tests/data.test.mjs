import test from 'node:test';
import assert from 'node:assert/strict';
import { loadU19, aggregateU19, loadFifaTables, buildWorldCup, readJSON, parseCSV, toCSV } from '../scripts/data.mjs';

test('UEFA extraction retains 182 unique dated qualifying records from the seven cited pages', () => {
  const rows = loadU19();
  assert.equal(rows.length, 182);
  assert.equal(new Set(rows.map(row => `${row.country}/${row.player_name}/${row.birth_date}`)).size, 182);
  assert.deepEqual([...new Set(rows.map(row => row.source_page))].sort((a, b) => a - b), [9, 13, 17, 21, 25, 29, 35]);
});

test('country and month totals reconcile to the source squads rather than a uniform squad size', () => {
  const { countries } = aggregateU19(loadU19());
  const totals = Object.fromEntries(Object.entries(countries).map(([country, counts]) => [country, counts.reduce((a, b) => a + b, 0)]));
  assert.deepEqual(totals, { Denmark: 25, England: 27, Germany: 26, Montenegro: 25, Netherlands: 26, Norway: 28, Spain: 25 });
  const months = Array.from({ length: 12 }, (_, i) => Object.values(countries).reduce((total, counts) => total + counts[i], 0));
  assert.equal(months[0], 33);
  assert.equal(months.reduce((a, b) => a + b, 0), 182);
});

const wc = () => buildWorldCup(loadFifaTables(), readJSON('data/raw/world-cup-cohort.json')).players;

test('the selected player cohort covers ten countries and four position groups', () => {
  const players = wc();
  assert.equal(players.length, 12);
  assert.equal(new Set(players.map(p => p.name)).size, 12);
  assert.equal(new Set(players.map(p => p.countryCode)).size, 10);
  assert.equal(new Set(players.map(p => p.pos)).size, 4);
});

test('joins preserve known numeric values and the difference between missing and zero', () => {
  const players = wc();
  const mbappe = players.find(p => p.name === 'Kylian Mbappe');
  assert.deepEqual([mbappe.goals, mbappe.assists, mbappe.minutes], [10, 4, 769]);
  assert.equal(players.find(p => p.name === 'Brahim Diaz').goals, 0);
  assert.equal(players.find(p => p.name === 'Endrick').goals, null);
  assert.equal(players.find(p => p.name === 'Thibaut Courtois').saves, 17);
  assert.equal(players.filter(p => p.goals != null).length, 8);
  assert.equal(players.reduce((sum, p) => sum + (p.goals ?? 0), 0), 22);
});

test('the snapshot inventory records partial player tables and complete 48-team tables', () => {
  const players = loadFifaTables();
  assert.equal(players.Movement.length - 1, 50);
  assert.equal(players.Goalkeeping.length - 1, 145);
  assert.equal(players.Discipline.length - 1, 50);
  assert.equal(Object.keys(players).length, 8);
  const teams = loadFifaTables('teams');
  assert.equal(Object.keys(teams).length, 7);
  for (const table of Object.values(teams)) assert.equal(table.length - 1, 48);
});

test('CSV exports preserve commas, quotes, newlines, Unicode and empty values', () => {
  const rows = [['name', 'note'], ['Luka Callø', 'one, two'], ['A "B"', 'line\nbreak'], ['', '']];
  assert.deepEqual(parseCSV(toCSV(rows)), rows);
  assert.throws(() => parseCSV('"unclosed'), /Unclosed/);
});

test('an unknown cohort member fails rather than silently generating an empty player', () => {
  assert.throws(() => buildWorldCup(loadFifaTables(), [{ name: 'Unknown Player', zh: 'Unknown' }]), /not found/);
});
