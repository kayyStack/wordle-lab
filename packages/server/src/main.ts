import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // `||` so a blank PORT= falls back too
  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
