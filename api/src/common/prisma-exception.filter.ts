import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/** Reason phrases matching Nest's own HttpException bodies. */
const REASON: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

/**
 * Maps the Prisma errors that can still reach the transport layer to sensible
 * HTTP responses, in the same body shape Nest uses. Most invalid input is
 * already rejected earlier by the DTOs and the service's own checks; this is
 * the safety net (e.g. a row deleted concurrently between check and write).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.translate(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled Prisma error ${exception.code}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: REASON[status] ?? 'Error',
    });
  }

  private translate(exception: Prisma.PrismaClientKnownRequestError): {
    status: HttpStatus;
    message: string;
  } {
    switch (exception.code) {
      case 'P2025': // record required for the operation was not found
        return { status: HttpStatus.NOT_FOUND, message: 'Resource not found' };
      case 'P2002': // unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          message: 'Resource already exists',
        };
      case 'P2003': // foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Referenced resource does not exist',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        };
    }
  }
}
