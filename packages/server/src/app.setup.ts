import { INestApplication } from '@nestjs/common';

/** Settings shared by the real server and the HTTP tests */
export function setUpApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
}
