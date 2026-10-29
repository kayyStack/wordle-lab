import { Inject, Injectable } from '@nestjs/common';
import { fork } from 'child_process';
import { readFileSync } from 'fs';
import { apiError } from '../games/api-error';

export const SIMULATION_PATHS = 'SIMULATION_PATHS';

export interface SimulationPaths {
  /** Where the simulate command saves its results */
  file: string;
  /** The compiled simulate command */
  command: string;
}

export interface Run {
  startedAt: string;
  done: number;
  total: number;
}

export interface Failure {
  at: string;
  message: string;
}

// A full run needs under 8 MB, so going over this means something is wrong.
// Only the command stops; the server keeps going.
const MAX_MEMORY_MB = 64;

/**
 * Rerun runs the same simulate command you can run in the terminal, as a
 * separate process, and keeps track of it. Only one runs at a time.
 */
@Injectable()
export class SimulationService {
  private running: Run | null = null;
  private failure: Failure | null = null;

  constructor(
    @Inject(SIMULATION_PATHS) private readonly paths: SimulationPaths,
  ) {}

  /** The saved results (without each game), and the run going on or the last failure */
  status() {
    return {
      results: this.savedResults(),
      run: this.running,
      failure: this.failure,
    };
  }

  /** Starts the command, or returns the run already going */
  start(): Run {
    if (this.running) return this.running;

    const run: Run = { startedAt: new Date().toISOString(), done: 0, total: 0 };
    this.running = run;
    this.failure = null;

    const finish = (message: string | null) => {
      // 'error' and 'exit' can both arrive for one run
      if (this.running !== run) return;
      this.running = null;
      if (message) this.failure = { at: new Date().toISOString(), message };
    };

    const command = fork(this.paths.command, [], {
      execArgv: [`--max-old-space-size=${MAX_MEMORY_MB}`],
      // The command's output stays out of the server's own; its errors are
      // kept to explain a failure
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    });
    // The start says what went wrong; a long native stack trace can follow
    let errors = '';
    command.stderr!.on('data', (chunk: Buffer) => {
      if (errors.length < 2000) errors += chunk.toString();
    });
    command.on('message', (progress: { done: number; total: number }) => {
      run.done = progress.done;
      run.total = progress.total;
    });
    // The command couldn't be started at all
    command.on('error', (error) => finish(error.message));
    command.on('exit', (code, signal) => {
      if (code === 0) finish(null);
      else if (errors.includes('heap out of memory')) {
        finish('The simulation ran out of memory');
      } else {
        finish(
          `The simulation stopped early (${signal ?? `exit code ${code}`})`,
        );
      }
    });
    return run;
  }

  private savedResults() {
    let text: string;
    try {
      text = readFileSync(this.paths.file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    try {
      // Every game's guesses stay in the file; the page polls this often
      const { games: _games, ...results } = JSON.parse(text);
      return results;
    } catch {
      throw apiError(
        500,
        'simulation-unreadable',
        'The saved simulation results could not be read',
      );
    }
  }
}
