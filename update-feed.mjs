// Legge le novità dal sito del Comune di Città di Castello e le salva in news.json.
// Il bot Devvit legge poi news.json da GitHub (raw.githubusercontent.com).

import { writeFile } from 'node:fs/promises';

const BASE = 'https://r.jina.ai/https://www.comune.cittadicastello.pg.it';
const FEED = process.env.FEED_URL ?? `${BASE}/news.json.php?page=1&limit=20&notizieScadute=1`;
const OUT = new URL('./news.json', import.meta.url);
const UA = 'cittadicastello-news-bot/1.0 (una lettura al giorno, solo notizie pubbliche)';

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  Agrave: 'À', Egrave: 'È', Eacute: 'É', deg: '°',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…',
};

function decode(text = '') {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
      if (entity[0] === '#') {
        const code =
          entity[1].toLowerCase() === 'x'
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return NAMED[entity] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

const res = await fetch(FEED, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
if (!res.ok) throw new Error(`Sito del Comune: HTTP ${res.status}`);
const data = await res.json();
const raw = data.notizie ?? [];
if (raw.length === 0) throw new Error('Nessuna notizia ricevuta: news.json non viene toccato.');

const notizie = raw.map((n) => ({
  id: String(n.id),
  titolo: decode(n.titolo),
  url: new URL(n.url, BASE).href,
  data: n.data_notizia,
  tipologia: n.tipologia,
}));

await writeFile(OUT, JSON.stringify({ notizie }, null, 2) + '\n');
console.log(`Salvate ${notizie.length} notizie in news.json`);
