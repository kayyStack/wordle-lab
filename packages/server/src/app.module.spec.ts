import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Proves the toolchain works end to end under Jest: ts-jest compiles the
// decorators, and Nest can build the module graph. No HTTP server is started.
describe('AppModule', () => {
  it('boots a Nest application context', async () => {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });
    expect(app.get(AppModule)).toBeInstanceOf(AppModule);
    await app.close();
  });
});
