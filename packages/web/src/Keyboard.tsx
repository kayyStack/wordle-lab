import type { TileColour } from './types.ts';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

interface KeyboardProps {
  colours: Record<string, TileColour>;
  /** True once the game is over: the keys fade and stop working */
  disabled: boolean;
  /** Called with a letter, 'Enter' or 'Backspace' */
  onKey: (key: string) => void;
}

export function Keyboard({ colours, disabled, onKey }: KeyboardProps) {
  return (
    <div className={`keyboard ${disabled ? 'off' : ''}`} aria-label="Keyboard">
      {ROWS.map((letters, row) => (
        <div className={`keyboard-row row-${row}`} key={letters}>
          {row === 2 && (
            <button
              disabled={disabled}
              className="key wide"
              onClick={() => onKey('Enter')}
            >
              Enter
            </button>
          )}
          {[...letters].map((letter) => (
            <button
              disabled={disabled}
              className={`key ${colours[letter] ?? ''}`}
              key={letter}
              onClick={() => onKey(letter)}
            >
              {letter}
            </button>
          ))}
          {row === 2 && (
            <button
              disabled={disabled}
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
