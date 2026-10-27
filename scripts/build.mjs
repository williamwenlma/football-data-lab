import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, readJSON, loadU19, aggregateU19, loadFifaTables, buildWorldCup, toCSV } from './data.mjs';

const check = process.argv.includes('--check');
const outputs = new Map();
const json = value => JSON.stringify(value, null, 2) + '\n';
const script = (key, value) => 'window.FOOTBALL_DATA = window.FOOTBALL_DATA || {};\nwindow.FOOTBALL_DATA.' + key + ' = ' + JSON.stringify(value).replaceAll('<', '\\u003c') + ';\n';
const u19 = aggregateU19(loadU19());
const playerTables = loadFifaTables('players');
const teamTables = loadFifaTables('teams');
const wc = buildWorldCup(playerTables, readJSON('data/raw/world-cup-cohort.json'));
outputs.set('data/derived/u19-months.json', json(u19));
outputs.set('data/derived/u19-months.js', script('u19', u19));
outputs.set('data/derived/world-cup-players.json', json(wc));
outputs.set('data/derived/world-cup-players.js', script('worldCup', wc));
const months = [['country', 'month', 'players']];
for (const [country, counts] of Object.entries(u19.countries)) counts.forEach((count, index) => months.push([country, index + 1, count]));
outputs.set('data/csv/u19-monthly.csv', toCSV(months));
const headers = Object.keys(wc.players[0]);
outputs.set('data/csv/world-cup-cohort.csv', toCSV([headers, ...wc.players.map(player => headers.map(key => player[key]))]));
const countryNames = { FRA: 'France', ENG: 'England', BRA: 'Brazil', TUR: 'Türkiye', MAR: 'Morocco', NED: 'Netherlands', ESP: 'Spain', GER: 'Germany', BEL: 'Belgium', URU: 'Uruguay' };
const positionNames = { '前锋': 'Forward', '中场': 'Midfielder', '后卫': 'Defender', '门将': 'Goalkeeper' };
const englishHeaders = headers.filter(key => key !== 'zh');
const englishPlayers = wc.players.map(player => ({ ...player, country: countryNames[player.countryCode], pos: positionNames[player.pos] }));
outputs.set('data/csv/world-cup-cohort.en.csv', toCSV([englishHeaders, ...englishPlayers.map(player => englishHeaders.map(key => player[key]))]));
for (const [group, tables] of Object.entries({ players: playerTables, teams: teamTables })) {
  for (const [category, table] of Object.entries(tables)) outputs.set(`data/csv/fifa-${group}-${category.toLowerCase().replaceAll(' ', '-')}.csv`, toCSV(table));
}
const sources = [];
function scan(directory) {
  for (const name of fs.readdirSync(directory).sort()) {
    const full = path.join(directory, name);
    if (fs.statSync(full).isDirectory()) scan(full);
    else sources.push({ path: path.relative(ROOT, full).replaceAll('\\', '/'), sha256: createHash('sha256').update(fs.readFileSync(full)).digest('hex') });
  }
}
scan(path.join(ROOT, 'data/raw'));
outputs.set('data/derived/source-manifest.json', json({ sources, rows: {
  u19: u19.total,
  fifaPlayers: Object.fromEntries(Object.entries(playerTables).map(([name, table]) => [name, table.length - 1])),
  fifaTeams: Object.fromEntries(Object.entries(teamTables).map(([name, table]) => [name, table.length - 1]))
} }));
for (const [relative, content] of outputs) {
  const full = path.join(ROOT, relative);
  if (check) {
    if (!fs.existsSync(full) || fs.readFileSync(full, 'utf8') !== content) throw new Error(`Generated file is stale: ${relative}. Run npm run build.`);
  } else {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}
console.log(`${check ? 'Verified' : 'Generated'} ${outputs.size} files: ${u19.total} U19 records, ${wc.players.length} selected World Cup players.`);
