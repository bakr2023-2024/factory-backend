import { ErrorDetail } from "./types/types";

export abstract class HttpException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly cause?: ErrorDetail[],
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error?.captureStackTrace(this, this.constructor);
  }
}
export class BadRequestException extends HttpException {
  constructor(message: string, cause?: ErrorDetail[]) {
    super(message, 400, cause);
  }
}
export class ConflictException extends HttpException {
  constructor(message: string, cause?: ErrorDetail[]) {
    super(message, 409, cause);
  }
}
export class NotFoundException extends HttpException {
  constructor(message: string, cause?: ErrorDetail[]) {
    super(message, 404, cause);
  }
}
export class InternalServerException extends HttpException {
  constructor(message: string, cause?: ErrorDetail[]) {
    super(message, 500, cause);
  }
}
