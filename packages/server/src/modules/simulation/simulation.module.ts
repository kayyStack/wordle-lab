import { Module } from '@nestjs/common';
import * as path from 'path';
import { SimulationController } from './simulation.controller';
import { SIMULATION_PATHS, SimulationService } from './simulation.service';

@Module({
  controllers: [SimulationController],
  providers: [
    SimulationService,
    {
      provide: SIMULATION_PATHS,
      // From dist/modules/simulation/, in both yarn dev and yarn start
      useValue: {
        file: path.join(__dirname, '../../../data/simulation.json'),
        command: path.join(__dirname, '../../simulate.js'),
      },
    },
  ],
})
export class SimulationModule {}
