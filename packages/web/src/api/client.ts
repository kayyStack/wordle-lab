import type {
  ApiErrorBody,
  GameView,
  GuessResponse,
  HintResponse,
  SimulationRun,
  SimulationStatus,
} from './types.ts';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/** A failed request. `code` is the API's error code, or 'unreachable' when no response came back. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: object) {
  let res: Response;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'unreachable', 'The server could not be reached');
  }
  const json = await res.json();
  if (!res.ok) {
    const error = json as ApiErrorBody;
    throw new ApiError(res.status, error.code, error.message);
  }
  return json as T;
}

export function createGame() {
  return request<GameView>('POST', '/games');
}

export function getGame(gameId: string) {
  return request<GameView>('GET', `/games/${gameId}`);
}

export function guess(gameId: string, word: string) {
  return request<GuessResponse>('POST', `/games/${gameId}/guesses`, { word });
}

export function hint(gameId: string) {
  return request<HintResponse>('GET', `/games/${gameId}/hint`);
}

export function simulationStatus() {
  return request<SimulationStatus>('GET', '/simulation');
}

/** Starts a run, or joins the one already going */
export function startSimulation() {
  return request<SimulationRun>('POST', '/simulation/runs');
}
