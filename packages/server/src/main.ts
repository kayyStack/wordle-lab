import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setUpApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setUpApp(app);
  // `||` so a blank PORT= falls back too
  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
