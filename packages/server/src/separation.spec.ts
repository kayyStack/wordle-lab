import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// The game logic has to work without the web layer,
// and the engine must not depend on the solver, which is built on top of it.

const ENGINE_DIR = path.join(__dirname, 'engine');
const SOLVER_DIR = path.join(__dirname, 'solver');
const WEB_MODULES = [/^@nestjs\//, /^express$/, /^(node:)?https?$/];

interface Import {
  file: string;
  from: string;
}

function importsIn(dir: string): Import[] {
  const found: Import[] = [];
  for (const name of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
    if (!name.endsWith('.ts')) continue;
    const file = path.join(dir, name);
    const { importedFiles } = ts.preProcessFile(readFileSync(file, 'utf8'));
    for (const imported of importedFiles) {
      found.push({
        file: path.relative(__dirname, file),
        from: imported.fileName,
      });
    }
  }
  return found;
}

describe('separation of game logic', () => {
  const engine = importsIn(ENGINE_DIR);
  const solver = importsIn(SOLVER_DIR);

  it('finds the imports it is checking', () => {
    expect(engine).toContainEqual({ file: 'engine/game.ts', from: './score' });
    expect(solver).toContainEqual({
      file: 'solver/suggest.ts',
      from: '../engine/score',
    });
  });

  it('keeps the engine and solver free of web code', () => {
    const webImports = [...engine, ...solver].filter((i) =>
      WEB_MODULES.some((pattern) => pattern.test(i.from)),
    );
    expect(webImports).toEqual([]);
  });

  it('keeps the engine independent of the solver', () => {
    const solverImports = engine.filter((i) => {
      const target = path.resolve(
        path.dirname(path.join(__dirname, i.file)),
        i.from,
      );
      return target.startsWith(SOLVER_DIR);
    });
    expect(solverImports).toEqual([]);
  });
});
