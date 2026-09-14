export class HttpException extends Error {
  constructor(
    message: string = "Internal Server Error",
    public readonly statusCode: number = 500,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error?.captureStackTrace(this, this.constructor);
  }
}
export class BadRequestException extends HttpException {
  constructor(message: string, cause?: unknown) {
    super(message, 400, cause);
  }
}
export class ConflictException extends HttpException {
  constructor(message: string, cause?: unknown) {
    super(message, 409, cause);
  }
}
