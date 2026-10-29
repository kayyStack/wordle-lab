import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { setUpApp } from '../app.setup';
import { GamesService } from './games.service';

// Starts the real app on a free port and calls it over HTTP, as the web page will.
describe('games API', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    setUpApp(app);
    await app.listen(0);
    baseUrl = `${await app.getUrl()}/api`;
  });

  afterAll(async () => {
    await app.close();
  });

  async function request(method: 'GET' | 'POST', path: string, body?: object) {
    const res = await fetch(baseUrl + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body && JSON.stringify(body),
    });
    // Tests read whatever fields they check, so the body is left untyped
    const json: any = await res.json();
    return { status: res.status, body: json };
  }

  function startGame(secret: string): string {
    return app.get(GamesService).create(secret).id;
  }

  it('starts a game without revealing the secret', async () => {
    const res = await request('POST', '/games');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'playing',
      maxGuesses: 6,
      guesses: [],
      remainingWords: 2315,
      secret: null,
    });
    expect(typeof res.body.id).toBe('string');
  });

  it('scores a guess and updates the remaining count', async () => {
    const id = startGame('SHAKE');
    const res = await request('POST', `/games/${id}/guesses`, {
      word: 'crane',
    });
    expect(res.status).toBe(200);
    expect(res.body.guess).toEqual({
      word: 'CRANE',
      colours: ['gray', 'gray', 'green', 'gray', 'green'],
    });
    expect(res.body.game).toMatchObject({
      status: 'playing',
      remainingWords: 44,
      secret: null,
    });
  });

  it('reveals the secret once the game is won', async () => {
    const id = startGame('SHAKE');
    const res = await request('POST', `/games/${id}/guesses`, {
      word: 'shake',
    });
    expect(res.body.game).toMatchObject({ status: 'won', secret: 'SHAKE' });
  });

  describe('errors', () => {
    async function guess(id: string, body: object) {
      return request('POST', `/games/${id}/guesses`, body);
    }

    it('refuses a guess that is not five letters', async () => {
      const res = await guess(startGame('SHAKE'), { word: 'cran' });
      expect(res).toEqual({
        status: 400,
        body: {
          statusCode: 400,
          code: 'not-five-letters',
          message: 'Guesses must be 5 letters',
        },
      });
    });

    it('refuses a word that is not in the word list', async () => {
      const res = await guess(startGame('SHAKE'), { word: 'zzzzz' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('not-in-word-list');
    });

    it('refuses a guess or a hint once the game is over', async () => {
      const id = startGame('SHAKE');
      await guess(id, { word: 'shake' });
      const guessRes = await guess(id, { word: 'crane' });
      const hintRes = await request('GET', `/games/${id}/hint`);
      for (const res of [guessRes, hintRes]) {
        expect(res.status).toBe(409);
        expect(res.body.code).toBe('game-over');
      }
    });

    it('reports an unknown game id', async () => {
      const guessRes = await guess('no-such-game', { word: 'crane' });
      const hintRes = await request('GET', '/games/no-such-game/hint');
      for (const res of [guessRes, hintRes]) {
        expect(res.status).toBe(404);
        expect(res.body.code).toBe('game-not-found');
      }
    });

    it('refuses a body without a word', async () => {
      const id = startGame('SHAKE');
      for (const body of [{}, { word: 5 }]) {
        const res = await guess(id, body);
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('invalid-body');
      }
    });

    it('refuses a request with no JSON body', async () => {
      const url = `${baseUrl}/games/${startGame('SHAKE')}/guesses`;
      const noBody = await fetch(url, { method: 'POST' });
      const textBody = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'crane',
      });
      for (const res of [noBody, textBody]) {
        const json: any = await res.json();
        expect(res.status).toBe(400);
        expect(json.code).toBe('invalid-body');
      }
    });
  });

  it('gives the first hint without searching every allowed guess', async () => {
    const id = startGame('SHAKE');
    const started = Date.now();
    const res = await request('GET', `/games/${id}/hint`);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(res.body.remainingWords).toBe(2315);
    expect(res.body.suggestions.map((s: { word: string }) => s.word)).toEqual([
      'SOARE',
      'ROATE',
      'RAISE',
      'RAILE',
      'REAST',
    ]);
  });

  it('gives five suggestions with reasons', async () => {
    const id = startGame('SHAKE');
    await request('POST', `/games/${id}/guesses`, { word: 'crane' });
    const res = await request('GET', `/games/${id}/hint`);
    expect(res.status).toBe(200);
    expect(res.body.remainingWords).toBe(44);
    expect(res.body.suggestions).toHaveLength(5);
    expect(res.body.suggestions[0]).toMatchObject({
      word: 'STULM',
      reason:
        'Splits the 44 remaining words into 21 groups; at worst 6 would be left.',
    });
  });

  it('lets the web page call it from another origin', async () => {
    const res = await fetch(`${baseUrl}/games`, {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:5173',
    );
  });
});
