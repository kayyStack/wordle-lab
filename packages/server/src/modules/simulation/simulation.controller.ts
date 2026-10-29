import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { SimulationService } from './simulation.service';

@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulation: SimulationService) {}

  @Get()
  status() {
    return this.simulation.status();
  }

  // 202: the run has started (or was already going) and finishes later
  @Post('runs')
  @HttpCode(202)
  start() {
    return this.simulation.start();
  }
}
