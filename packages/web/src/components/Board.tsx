import type { CSSProperties } from 'react';
import { STAGGER_MS } from '../lib/motion.ts';
import type { Guess, TileColour } from '../api/types.ts';
import { WORD_LENGTH } from '../lib/typing.ts';

/** What each colour tells the player, for screen readers */
export const COLOUR_NAMES: Record<TileColour, string> = {
  green: 'right spot',
  yellow: 'wrong spot',
  gray: 'not in word',
};

interface BoardProps {
  guesses: Guess[];
  typed: string;
  rows: number;
  /** Refusals of the row being typed; each one makes it wobble again */
  refusals: number;
  /** The row being typed holds a word the game refused: outline it */
  refusedRow: boolean;
  won: boolean;
}

export function Board({
  guesses,
  typed,
  rows,
  refusals,
  refusedRow,
  won,
}: BoardProps) {
  const latest = guesses.length - 1;
  return (
    <div className="board" aria-label="Board">
      {Array.from({ length: rows }, (_, row) => {
        const guess = guesses[row];
        const current = row === guesses.length;
        const letters = guess?.word ?? (current ? typed : '');
        // The newest guess flips; the winning row then wobbles. A new key
        // remounts the row being typed, so each refusal replays its wobble.
        const motion = row === latest ? (won ? 'reveal win' : 'reveal') : '';
        const wobble = current && refusals > 0 ? 'wobble' : '';
        return (
          <div
            className={`board-row ${motion} ${wobble}`}
            key={current ? `${row}-${refusals}` : row}
          >
            {Array.from({ length: WORD_LENGTH }, (_, i) => {
              const letter = letters[i] ?? '';
              const colour = guess?.colours[i];
              const state =
                colour ??
                (current && refusedRow ? 'bad' : letter ? 'typed' : '');
              return (
                <span
                  className={`tile ${state}`}
                  key={i}
                  style={
                    {
                      '--i': i,
                      '--stagger': `${STAGGER_MS}ms`,
                    } as CSSProperties
                  }
                  aria-label={
                    colour
                      ? `${letter}, ${COLOUR_NAMES[colour]}`
                      : letter || 'empty'
                  }
                >
                  {letter}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
