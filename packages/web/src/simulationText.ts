import type { SimulationResults } from './types.ts';

const MAX_GUESSES = 6;

type Summary = SimulationResults['summary'];

/** "It won every game. Most took 3 or 4 guesses, and only one, WAVER, needed all 6." */
export function resultText(summary: Summary): string {
  const counts = Object.entries(summary.byGuesses).map(([guesses, games]) => ({
    guesses: Number(guesses),
    games,
  }));

  const lost = counts
    .filter((c) => c.guesses > MAX_GUESSES)
    .reduce((sum, c) => sum + c.games, 0);
  const won =
    lost === 0
      ? 'It won every game.'
      : `It won ${(summary.games - lost).toLocaleString('en-US')} of the ${summary.games.toLocaleString('en-US')} games.`;

  // The two most common numbers of guesses, smaller first
  const common = [...counts]
    .sort((a, b) => b.games - a.games)
    .slice(0, 2)
    .map((c) => c.guesses)
    .sort((a, b) => a - b);
  const most = `Most took ${common.join(' or ')} guesses`;

  const { secret, guesses } = summary.hardest;
  const longest = guesses.length;
  const needed = longest === MAX_GUESSES ? `all ${longest}` : `${longest}`;
  const hardest =
    summary.byGuesses[longest] === 1
      ? `only one, ${secret}, needed ${needed}`
      : `the hardest, like ${secret}, needed ${needed}`;

  return `${won} ${most}, and ${hardest}.`;
}

/** "Last played 29 October 2026, in 15 seconds." */
export function lastRunText(results: SimulationResults): string {
  const date = new Date(results.ranAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `Last played ${date}, in ${seconds(results.durationMs)}.`;
}

export function seconds(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  return s === 1 ? '1 second' : `${s} seconds`;
}
