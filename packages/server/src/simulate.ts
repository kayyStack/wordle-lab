import { renameSync, writeFileSync } from 'fs';
import * as path from 'path';
import { loadWords } from './engine/words';
import { simulate, summarise } from './solver/simulate';

// Plays one game for every possible answer and saves the results to
// data/simulation.json. With --limit N it plays only the first N answers and
// prints the totals without saving, as a quick check.
//
//   node dist/simulate.js
//   node dist/simulate.js --limit 50

const OUT_FILE = path.join(__dirname, '../data/simulation.json');

const limitAt = process.argv.indexOf('--limit');
const limit = limitAt === -1 ? undefined : Number(process.argv[limitAt + 1]);
if (limit !== undefined && !(limit > 0)) {
  console.error('--limit needs a number above 0');
  process.exit(1);
}

const { possibleAnswers, allowedGuesses, firstHintWords } = loadWords();
const secrets = possibleAnswers.slice(0, limit);

const started = Date.now();
const games = simulate(
  possibleAnswers,
  allowedGuesses,
  firstHintWords,
  secrets,
  (done, total) => process.stdout.write(`\rPlayed ${done} of ${total}`),
);
const durationMs = Date.now() - started;
const summary = summarise(games);

console.log(`\nTook ${(durationMs / 1000).toFixed(1)} s`);
console.log(`Average: ${summary.average.toFixed(3)} guesses`);
for (const [guesses, count] of Object.entries(summary.byGuesses)) {
  console.log(`  ${guesses} guesses: ${count}`);
}

if (limit === undefined) {
  const ranAt = new Date(started).toISOString();
  // One game per line keeps the file small and its changes easy to read
  const head = JSON.stringify({ ranAt, durationMs, summary }, null, 2);
  const lines = games.map((game) => `    ${JSON.stringify(game)}`);
  // Written beside the file and renamed over it, so anything reading it sees
  // the old results or the new ones, never half a file
  const tmpFile = `${OUT_FILE}.tmp`;
  writeFileSync(
    tmpFile,
    `${head.slice(0, -2)},\n  "games": [\n${lines.join(',\n')}\n  ]\n}\n`,
  );
  renameSync(tmpFile, OUT_FILE);
  console.log(`Saved ${path.relative(process.cwd(), OUT_FILE)}`);
}
