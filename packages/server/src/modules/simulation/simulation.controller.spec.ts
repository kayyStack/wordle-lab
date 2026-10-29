import { INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { setUpApp } from '../../app.setup';
import { SimulationController } from './simulation.controller';
import { SIMULATION_PATHS, SimulationService } from './simulation.service';

// The simulation routes over real HTTP, with a quick fake command in place of
// the real one
const dir = mkdtempSync(path.join(tmpdir(), 'simulation-http-'));
const command = path.join(dir, 'command.js');
writeFileSync(command, 'setTimeout(() => {}, 200);');

@Module({
  controllers: [SimulationController],
  providers: [
    SimulationService,
    {
      provide: SIMULATION_PATHS,
      useValue: { file: path.join(dir, 'none.json'), command },
    },
  ],
})
class TestModule {}

describe('simulation API', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await NestFactory.create(TestModule, { logger: false });
    setUpApp(app);
    await app.listen(0);
    baseUrl = `${await app.getUrl()}/api/simulation`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('says there are no results yet', async () => {
    const res = await fetch(baseUrl);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      results: null,
      run: null,
      failure: null,
    });
  });

  it('starts a run and shows it', async () => {
    const started = await fetch(`${baseUrl}/runs`, { method: 'POST' });
    expect(started.status).toBe(202);
    const run = await started.json();
    expect(run).toMatchObject({ done: 0 });

    const res = await fetch(baseUrl);
    // Tests read whatever fields they check, so the body is left untyped
    const json: any = await res.json();
    expect(json.run).toEqual(run);
  });
});
