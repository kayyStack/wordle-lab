import { HttpException } from '@nestjs/common';
import { GamesService } from './games.service';

const MINUTE = 60_000;

describe('GamesService expiry', () => {
  let service: GamesService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new GamesService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function exists(id: string): boolean {
    try {
      service.find(id);
      return true;
    } catch (e) {
      if (e instanceof HttpException && e.getStatus() === 404) return false;
      throw e;
    }
  }

  it('removes a finished game two minutes after it ended, even if looked up', () => {
    const { id } = service.create('SHAKE');
    service.guess(id, 'SHAKE');
    jest.advanceTimersByTime(1 * MINUTE);
    expect(exists(id)).toBe(true);
    jest.advanceTimersByTime(1 * MINUTE + 1);
    expect(exists(id)).toBe(false);
  });

  it('keeps an unfinished game for an hour without activity', () => {
    const kept = service.create('SHAKE').id;
    const dropped = service.create('SHAKE').id;
    jest.advanceTimersByTime(59 * MINUTE);
    expect(exists(kept)).toBe(true);
    jest.advanceTimersByTime(2 * MINUTE);
    expect(exists(dropped)).toBe(false);
  });

  it('counts the hour from the last guess', () => {
    const { id } = service.create('SHAKE');
    jest.advanceTimersByTime(50 * MINUTE);
    service.guess(id, 'CRANE');
    jest.advanceTimersByTime(50 * MINUTE);
    expect(exists(id)).toBe(true);
  });

  it('drops the least recently used game beyond 1,000 games', () => {
    const first = service.create('SHAKE').id;
    const second = service.create('SHAKE').id;
    service.find(first);
    for (let i = 0; i < 999; i++) service.create('SHAKE');
    expect(exists(second)).toBe(false);
    expect(exists(first)).toBe(true);
  });
});
