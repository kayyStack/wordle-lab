import type { TileColour } from '../api/types.ts';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

interface KeyboardProps {
  colours: Record<string, TileColour>;
  /** True once the game is over: the keys fade and stop working */
  disabled: boolean;
  /** The last key pressed, on screen or on a real keyboard; `id` changes on every press */
  flash: { key: string; id: number } | null;
  /** Called with a letter, 'Enter' or 'Backspace' */
  onKey: (key: string) => void;
}

export function Keyboard({ colours, disabled, flash, onKey }: KeyboardProps) {
  // A new React key remounts the pressed key, which replays its light-up
  const litId = (name: string) =>
    flash?.key === name ? `${name}-${flash.id}` : name;

  function keyProps(name: string, className: string) {
    const lit = flash?.key === name;
    return {
      className: `key ${className} ${lit ? 'lit' : ''}`,
      disabled,
      onClick: () => onKey(name),
    };
  }

  return (
    <div className={`keyboard ${disabled ? 'off' : ''}`} aria-label="Keyboard">
      {ROWS.map((letters, row) => (
        <div className={`keyboard-row row-${row}`} key={letters}>
          {row === 2 && (
            <button key={litId('Enter')} {...keyProps('Enter', 'wide')}>
              Enter
            </button>
          )}
          {[...letters].map((letter) => (
            <button
              key={litId(letter)}
              {...keyProps(letter, colours[letter] ?? '')}
            >
              {letter}
            </button>
          ))}
          {row === 2 && (
            <button
              key={litId('Backspace')}
              {...keyProps('Backspace', 'wide')}
              aria-label="Delete"
            >
              Del
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
