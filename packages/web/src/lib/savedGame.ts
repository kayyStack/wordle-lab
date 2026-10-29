// The id of this tab's game, so "Back to the game" or a reload picks it up
// again instead of starting over. sessionStorage belongs to one tab and
// clears when it closes, so another tab gets its own game.
const KEY = 'wordle-lab-game';

/** The saved game id, or null when there is none or storage is blocked */
export function savedGameId(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Remembers the game id; without storage the game just isn't resumed */
export function saveGameId(id: string): void {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    // Private windows and blocked site data can refuse storage
  }
}
