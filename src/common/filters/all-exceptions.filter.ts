import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export interface ErrorDetail {
  field: string;
  errors: string[];
}

export interface ErrorBody {
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: ErrorDetail[];
    path: string;
    timestamp: string;
  };
}

interface MappedError {
  status: number;
  message: string;
  details?: ErrorDetail[];
}

const CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

const DEFAULT_MESSAGES: Record<number, string> = {
  401: 'No autorizado',
  403: 'Acceso denegado',
  404: 'Recurso no encontrado',
  429: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
};

/**
 * Single place that turns any thrown value into the API error contract.
 * Unexpected errors are logged with their stack but never leak internals.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const mapped = this.map(exception);
    if (mapped.status >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.path} -> ${mapped.status}`, stack);
    }

    const body: ErrorBody = {
      error: {
        statusCode: mapped.status,
        code: CODES[mapped.status] ?? (mapped.status >= 500 ? 'INTERNAL_ERROR' : 'ERROR'),
        message: mapped.message,
        ...(mapped.details?.length ? { details: mapped.details } : {}),
        path: request.path,
        timestamp: new Date().toISOString(),
      },
    };
    response.status(mapped.status).json(body);
  }

  map(exception: unknown): MappedError {
    if (exception instanceof HttpException) return this.fromHttp(exception);
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception);
    }
    if (exception instanceof Prisma.PrismaClientUnknownRequestError && /check constraint/i.test(exception.message)) {
      return { status: 400, message: 'Los datos no cumplen las reglas de la base de datos' };
    }
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return { status: 503, message: 'Base de datos no disponible' };
    }
    const bodyParser = this.fromBodyParser(exception);
    if (bodyParser) return bodyParser;
    return { status: 500, message: 'Error interno del servidor' };
  }

  private fromHttp(exception: HttpException): MappedError {
    const status = exception.getStatus();
    const res = exception.getResponse();
    const { message, details } =
      typeof res === 'object' && res !== null
        ? (res as { message?: unknown; details?: ErrorDetail[] })
        : { message: res, details: undefined };
    const text = Array.isArray(message) ? message.join('; ') : message;
    // Framework defaults are English ("Unauthorized", "ThrottlerException: ...").
    const isGeneric = typeof text !== 'string' || /^ThrottlerException|^Unauthorized$|^Forbidden/.test(text);
    return {
      status,
      message: isGeneric ? (DEFAULT_MESSAGES[status] ?? exception.message) : text,
      details,
    };
  }

  private fromPrisma(error: Prisma.PrismaClientKnownRequestError): MappedError {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[] | string | undefined) ?? [];
        const fields = Array.isArray(target) ? target : [target];
        return {
          status: 409,
          message: 'Ya existe un registro con ese valor',
          details: fields.map((field) => ({ field, errors: ['debe ser único'] })),
        };
      }
      case 'P2003':
        return {
          status: 409,
          message: 'La operación afecta registros relacionados. Revisa las dependencias antes de continuar.',
        };
      case 'P2025':
      case 'P2001':
        return { status: 404, message: 'Recurso no encontrado' };
      case 'P2000':
        return { status: 400, message: 'Un valor excede la longitud permitida' };
      case 'P2004':
        return { status: 400, message: 'Los datos no cumplen las reglas de la base de datos' };
      case 'P2023':
        return { status: 400, message: 'Identificador inválido' };
      default:
        return { status: 500, message: 'Error interno del servidor' };
    }
  }

  private fromBodyParser(exception: unknown): MappedError | null {
    if (typeof exception !== 'object' || exception === null) return null;
    const { type, status } = exception as { type?: string; status?: number };
    if (type === 'entity.parse.failed') return { status: 400, message: 'JSON inválido' };
    if (type === 'entity.too.large') return { status: 413, message: 'La solicitud es demasiado grande' };
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return { status, message: 'Solicitud inválida' };
    }
    return null;
  }
}
