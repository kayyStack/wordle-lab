import { describe, expect, it } from 'vitest';
import { keyColours, nextTyped, pressKey } from './typing.ts';

describe('pressKey', () => {
  it('sends five letters on Enter', () => {
    expect(pressKey('CRANE', 'Enter', false)).toEqual({ submit: 'CRANE' });
  });

  it('does not send fewer than five letters', () => {
    expect(pressKey('CRAN', 'Enter', false)).toEqual({ typed: 'CRAN' });
  });

  it('types letters', () => {
    expect(pressKey('CRA', 'n', false)).toEqual({ typed: 'CRAN' });
  });

  it('ignores every key while locked', () => {
    expect(pressKey('CRANE', 'Enter', true)).toEqual({ typed: 'CRANE' });
    expect(pressKey('CRA', 'n', true)).toEqual({ typed: 'CRA' });
  });
});

describe('nextTyped', () => {
  it('adds letters in capitals', () => {
    expect(nextTyped('SH', 'a')).toBe('SHA');
  });

  it('stops at five letters', () => {
    expect(nextTyped('SHAKE', 'S')).toBe('SHAKE');
  });

  it('deletes the last letter', () => {
    expect(nextTyped('SHA', 'Backspace')).toBe('SH');
    expect(nextTyped('', 'Backspace')).toBe('');
  });

  it('ignores keys that are not letters', () => {
    expect(nextTyped('SH', '1')).toBe('SH');
    expect(nextTyped('SH', 'Shift')).toBe('SH');
  });
});

describe('keyColours', () => {
  it('keeps the best colour a letter has shown', () => {
    const colours = keyColours([
      { word: 'CRANE', colours: ['gray', 'gray', 'green', 'gray', 'green'] },
      { word: 'BLAST', colours: ['gray', 'gray', 'green', 'yellow', 'gray'] },
      { word: 'SHAKE', colours: ['green', 'green', 'green', 'green', 'green'] },
    ]);
    expect(colours).toMatchObject({
      C: 'gray',
      A: 'green',
      E: 'green',
      S: 'green',
    });
    expect(colours.Q).toBeUndefined();
  });

  it('does not let a later gray hide an earlier yellow', () => {
    // SPEED against ABIDE: the first E is yellow, the second gray
    const colours = keyColours([
      { word: 'SPEED', colours: ['gray', 'gray', 'yellow', 'gray', 'yellow'] },
    ]);
    expect(colours.E).toBe('yellow');
  });
});
