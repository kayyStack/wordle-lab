import { Module } from '@nestjs/common';
import { GamesModule } from './modules/games/games.module';
import { SimulationModule } from './modules/simulation/simulation.module';

@Module({
  imports: [GamesModule, SimulationModule],
})
export class AppModule {}
