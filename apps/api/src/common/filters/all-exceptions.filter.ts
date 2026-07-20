import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string;
  code?: string;
  details?: unknown;
  path: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Single error shape for the whole API.
 *
 * Internal failures return a generic Arabic message; the stack and the Prisma
 * error text stay in the server log. Leaking `Invalid \`prisma.user.findFirst()\``
 * to a client tells an attacker the ORM, the schema, and the query shape.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toBody(exception, request);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${body.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${body.statusCode}: ${body.message}`);
    }

    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown, request: Request): ErrorBody {
    const base = {
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: (request as { tenantContext?: { requestId: string } }).tenantContext?.requestId,
    };

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { ...base, statusCode: exception.getStatus(), message: res };
      }
      const obj = res as Record<string, unknown>;
      const message = obj.message;
      return {
        ...base,
        statusCode: exception.getStatus(),
        message: Array.isArray(message) ? message[0] : String(message ?? exception.message),
        code: obj.code as string | undefined,
        // class-validator returns an array of messages — surface them all so
        // the client can highlight every invalid field at once.
        details: Array.isArray(message) ? message : (obj.tenants ?? undefined),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return { ...base, ...this.fromPrisma(exception) };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { ...base, statusCode: HttpStatus.BAD_REQUEST, message: 'بيانات الطلب غير صالحة' };
    }

    return {
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'حدث خطأ غير متوقع. تم تسجيل المشكلة',
    };
  }

  private fromPrisma(e: Prisma.PrismaClientKnownRequestError): Pick<ErrorBody, 'statusCode' | 'message' | 'code'> {
    switch (e.code) {
      case 'P2002': {
        const target = (e.meta?.target as string[] | undefined)?.join('، ');
        return {
          statusCode: HttpStatus.CONFLICT,
          message: target ? `القيمة مستخدمة بالفعل: ${target}` : 'القيمة مستخدمة بالفعل',
          code: 'DUPLICATE',
        };
      }
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'سجل مرتبط غير موجود',
          code: 'FK_VIOLATION',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'السجل غير موجود',
          code: 'NOT_FOUND',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'حدث خطأ في قاعدة البيانات',
          code: 'DB_ERROR',
        };
    }
  }
}
