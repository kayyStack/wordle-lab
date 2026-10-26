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
});
