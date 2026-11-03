import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import type { ErrorDetail } from '../filters/all-exceptions.filter';

/** Spanish messages for the constraints used across the DTOs. */
const MESSAGES: Record<string, string> = {
  isNotEmpty: 'es obligatorio',
  isDefined: 'es obligatorio',
  isString: 'debe ser texto',
  isEmail: 'debe ser un correo electrónico válido',
  isBoolean: 'debe ser verdadero o falso',
  isInt: 'debe ser un número entero',
  isNumber: 'debe ser un número',
  isEnum: 'tiene un valor no permitido',
  isIn: 'tiene un valor no permitido',
  isUUID: 'debe ser un identificador válido',
  isArray: 'debe ser una lista',
  arrayUnique: 'no debe contener elementos repetidos',
  arrayMinSize: 'debe contener al menos un elemento',
  arrayMaxSize: 'contiene demasiados elementos',
  isISO8601: 'debe ser una fecha con formato AAAA-MM-DD',
  matches: 'tiene un formato inválido',
  whitelistValidation: 'no es un campo permitido',
  isEmpty: 'debe estar vacío',
};

function describe(key: string, original: string): string {
  // Messages written in our decorators are already Spanish; only defaults are English.
  const isDefault = /\b(must|should)\b/.test(original) || key === 'whitelistValidation';
  if (!isDefault) return original;
  if (key === 'maxLength')
    return original.replace(
      /^.* must be shorter than or equal to (\d+) characters$/,
      'debe tener como máximo $1 caracteres',
    );
  if (key === 'minLength')
    return original.replace(
      /^.* must be longer than or equal to (\d+) characters$/,
      'debe tener al menos $1 caracteres',
    );
  if (key === 'min') return original.replace(/^.* must not be less than (\d+)$/, 'debe ser mayor o igual a $1');
  if (key === 'max') return original.replace(/^.* must not be greater than (\d+)$/, 'debe ser menor o igual a $1');
  return MESSAGES[key] ?? original;
}

export function flattenValidationErrors(errors: ValidationError[], parent = ''): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own: ErrorDetail[] = error.constraints
      ? [{ field, errors: Object.entries(error.constraints).map(([k, m]) => describe(k, m)) }]
      : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: false,
    exceptionFactory: (errors) =>
      new BadRequestException({
        message: 'Los datos enviados no son válidos',
        details: flattenValidationErrors(errors),
      }),
  });
}
