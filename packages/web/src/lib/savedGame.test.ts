import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveGameId, savedGameId } from './savedGame.ts';

function fakeStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe('saved game id', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads back the id it saved', () => {
    vi.stubGlobal('sessionStorage', fakeStorage());
    expect(savedGameId()).toBeNull();
    saveGameId('game-1');
    expect(savedGameId()).toBe('game-1');
  });

  it('carries on without storage when the browser refuses it', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => saveGameId('game-1')).not.toThrow();
    expect(savedGameId()).toBeNull();
  });
});
