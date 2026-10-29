import { describe, expect, it } from 'vitest';
import { revealMs } from './motion.ts';

describe('revealMs', () => {
  it('lasts until the last of five tiles has flipped', () => {
    // Starts at 0, 250, 500, 750 and 1000ms; each flip takes 500ms
    expect(revealMs(5)).toBe(1500);
  });
});
