import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { SimulationService } from './simulation.service';

// Small plain-JavaScript commands stand in for the real simulate command,
// which only runs once compiled
const dir = mkdtempSync(path.join(tmpdir(), 'simulation-'));

function fakeCommand(name: string, body: string): string {
  const file = path.join(dir, `${name}.js`);
  writeFileSync(file, `const fs = require('fs');\n${body}`);
  return file;
}

function serviceFor(command: string, file = path.join(dir, 'none.json')) {
  return new SimulationService({ file, command });
}

async function until(check: () => boolean) {
  while (!check()) await new Promise((resolve) => setTimeout(resolve, 20));
}

const untilFinished = (service: SimulationService) =>
  until(() => service.status().run === null);

const RESULTS = { ranAt: '2026-10-29T12:00:00.000Z', durationMs: 15000 };

describe('SimulationService', () => {
  it('has no results before the first run', () => {
    const service = serviceFor('unused.js');
    expect(service.status()).toEqual({
      results: null,
      run: null,
      failure: null,
    });
  });

  it('runs the command, follows its progress and reads what it saved', async () => {
    const file = path.join(dir, 'saved.json');
    const command = fakeCommand(
      'saves',
      `process.send({ done: 1, total: 2 });
       setTimeout(() => {
         fs.writeFileSync(${JSON.stringify(file)},
           JSON.stringify({ ...${JSON.stringify(RESULTS)}, games: [] }));
       }, 200);`,
    );
    const service = serviceFor(command, file);

    expect(service.start()).toMatchObject({ done: 0 });
    await until(() => service.status().run?.done === 1);
    expect(service.status().run).toMatchObject({ done: 1, total: 2 });

    await untilFinished(service);
    // Without the games, which stay in the file
    expect(service.status()).toEqual({
      results: RESULTS,
      run: null,
      failure: null,
    });
  });

  it('joins the run already going instead of starting another', async () => {
    const starts = path.join(dir, 'starts.log');
    const command = fakeCommand(
      'slow',
      `fs.appendFileSync(${JSON.stringify(starts)}, 'started\\n');
       setTimeout(() => {}, 300);`,
    );
    const service = serviceFor(command);

    const first = service.start();
    const second = service.start();
    expect(second).toBe(first);
    await untilFinished(service);
    expect(readFileSync(starts, 'utf8')).toBe('started\n');
  });

  it('records a failed run and can start again', async () => {
    const service = serviceFor(fakeCommand('fails', 'process.exit(3);'));
    service.start();
    await untilFinished(service);
    expect(service.status().failure).toMatchObject({
      message: 'The simulation stopped early (exit code 3)',
    });

    service.start();
    expect(service.status().failure).toBeNull();
    await untilFinished(service);
  });

  it('stops only the command when it runs out of memory', async () => {
    const service = serviceFor(
      fakeCommand(
        'greedy',
        'const kept = []; for (;;) kept.push(new Array(1e5).fill(1));',
      ),
    );
    service.start();
    await untilFinished(service);
    expect(service.status().failure?.message).toBe(
      'The simulation ran out of memory',
    );
  }, 30_000);

  it('reports a saved file that is not JSON', () => {
    const broken = path.join(dir, 'broken.json');
    appendFileSync(broken, '{ "ranAt": ');
    expect(() => serviceFor('unused.js', broken).status()).toThrow(
      'could not be read',
    );
  });
});
