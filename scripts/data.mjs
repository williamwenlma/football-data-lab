import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const readJSON = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^\uFEFF/, ''));

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if (char === '\n' && !quoted) {
      row.push(field.replace(/\r$/, ''));
      rows.push(row); row = []; field = '';
    } else field += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

export function toCSV(rows) {
  return rows.map(row => row.map(value => {
    const text = value == null ? '' : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }).join(',')).join('\n') + '\n';
}

export function loadU19() {
  const [headers, ...rows] = parseCSV(fs.readFileSync(path.join(ROOT, 'data/raw/u19-players.csv'), 'utf8'));
  if (headers.join(',') !== 'country,player_name,birth_date,source_page') throw new Error('Unexpected U19 fields');
  return rows.map(row => {
    if (row.length !== headers.length) throw new Error('Malformed U19 record');
    const record = Object.fromEntries(headers.map((key, index) => [key, row[index]]));
    const date = new Date(record.birth_date + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.birth_date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== record.birth_date) throw new Error('Invalid birth date');
    return { ...record, source_page: Number(record.source_page) };
  });
}

export function aggregateU19(records) {
  const countries = {};
  for (const { country, birth_date } of records) {
    countries[country] ??= Array(12).fill(0);
    countries[country][Number(birth_date.slice(5, 7)) - 1]++;
  }
  return { countries, total: records.length, scope: 'qualifying-phase squad records with birth dates' };
}

export function loadFifaTables(group = 'players') {
  const directory = path.join(ROOT, 'data/raw/fifa', group);
  return Object.fromEntries(fs.readdirSync(directory).filter(file => file.endsWith('.json') && !file.startsWith('_')).sort().map(file => {
    const table = readJSON(`data/raw/fifa/${group}/${file}`);
    if (!Array.isArray(table) || table.length < 2 || table.some(row => !Array.isArray(row) || row.length !== table[0].length)) throw new Error(`Invalid table: ${file}`);
    return [file.replace(/\.json$/, ''), table];
  }));
}

const COUNTRIES = { FRA: '法国', ENG: '英格兰', BRA: '巴西', TUR: '土耳其', MAR: '摩洛哥', NED: '荷兰', ESP: '西班牙', GER: '德国', BEL: '比利时', URU: '乌拉圭' };
const POSITIONS = { FW: '前锋', MF: '中场', DF: '后卫', GK: '门将' };

export function buildWorldCup(tables, cohort) {
  const indexes = Object.fromEntries(Object.entries(tables).map(([category, table]) => {
    const playerColumn = table[0].indexOf('Player');
    if (playerColumn < 0) throw new Error(`Missing Player column: ${category}`);
    const index = new Map();
    for (const row of table.slice(1)) {
      const match = row[playerColumn].match(/^(.*) ([A-Z]{3}) (FW|MF|DF|GK)$/);
      if (!match) throw new Error(`Unrecognized player identity in ${category}`);
      if (index.has(match[1])) throw new Error(`Duplicate player in ${category}: ${match[1]}`);
      index.set(match[1], { countryCode: match[2], positionCode: match[3], fields: Object.fromEntries(table[0].map((header, i) => [header, row[i]])) });
    }
    return [category, index];
  }));
  function number(name, category, field) {
    if (!tables[category]?.[0].includes(field)) throw new Error(`Missing field ${category}/${field}`);
    const row = indexes[category].get(name);
    if (!row) return null;
    const raw = row.fields[field];
    if (raw == null || raw === '' || raw === '—') return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`Invalid numeric value for ${name}/${field}`);
    return value;
  }
  const players = cohort.map(({ name, zh }) => {
    const identities = Object.values(indexes).map(index => index.get(name)).filter(Boolean);
    if (!identities.length) throw new Error(`Cohort member not found: ${name}`);
    const { countryCode, positionCode } = identities[0];
    if (identities.some(row => row.countryCode !== countryCode || row.positionCode !== positionCode)) throw new Error(`Inconsistent identity: ${name}`);
    if (!COUNTRIES[countryCode] || !POSITIONS[positionCode]) throw new Error(`Unmapped identity: ${name}`);
    return {
      name, zh, countryCode, country: COUNTRIES[countryCode], pos: POSITIONS[positionCode],
      rank: number(name, 'adidas Golden Boot', 'Rank'),
      goals: number(name, 'adidas Golden Boot', 'Goals'),
      assists: number(name, 'adidas Golden Boot', 'Assists'),
      minutes: number(name, 'adidas Golden Boot', 'Minutes Played'),
      shots: number(name, 'Attacking', 'Attempts At Goal'),
      xg: number(name, 'Attacking', 'xG'),
      passAccuracy: number(name, 'Distribution', 'Passing Accuracy (%)'),
      speed: number(name, 'Physical', 'Top Speed (km/h)'),
      sprints: number(name, 'Physical', 'Sprints'),
      saves: number(name, 'Goalkeeping', 'Goalkeeper Saves')
    };
  });
  return { snapshotDateLabel: '2026-07-20', verification: 'local snapshots, not independently verified field by field', players };
}
