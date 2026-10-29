import { HttpException } from '@nestjs/common';

/** An HTTP error whose body is { statusCode, code, message } */
export function apiError(
  statusCode: number,
  code: string,
  message: string,
): HttpException {
  return new HttpException({ statusCode, code, message }, statusCode);
}
