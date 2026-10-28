import type { TileColour } from './types.ts';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

interface KeyboardProps {
  colours: Record<string, TileColour>;
  /** Called with a letter, 'Enter' or 'Backspace' */
  onKey: (key: string) => void;
}

export function Keyboard({ colours, onKey }: KeyboardProps) {
  return (
    <div className="keyboard" aria-label="Keyboard">
      {ROWS.map((letters, row) => (
        <div className={`keyboard-row row-${row}`} key={letters}>
          {row === 2 && (
            <button className="key wide" onClick={() => onKey('Enter')}>
              Enter
            </button>
          )}
          {[...letters].map((letter) => (
            <button
              className={`key ${colours[letter] ?? ''}`}
              key={letter}
              onClick={() => onKey(letter)}
            >
              {letter}
            </button>
          ))}
          {row === 2 && (
            <button
              className="key wide"
              aria-label="Delete"
              onClick={() => onKey('Backspace')}
            >
              Del
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
