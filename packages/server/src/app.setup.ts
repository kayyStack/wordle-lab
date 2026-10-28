import { INestApplication } from '@nestjs/common';

/** Settings shared by the real server and the HTTP tests */
export function setUpApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: allowedOrigins(process.env.CORS_ORIGINS) });
}

/** The origins listed in CORS_ORIGINS, or `true` (any origin) when it is unset or blank */
export function allowedOrigins(value: string | undefined): string[] | true {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : true;
}
