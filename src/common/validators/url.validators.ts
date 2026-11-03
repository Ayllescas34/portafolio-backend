import { isURL, ValidateBy, ValidationOptions } from 'class-validator';

type IsURLOptions = NonNullable<Parameters<typeof isURL>[1]>;

/** Files produced by MediaService: /uploads/<uuid>.<ext> */
export const UPLOAD_PATH_PATTERN =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$/;

const HTTP_URL_OPTIONS: IsURLOptions = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_valid_protocol: true,
  allow_underscores: true,
};

/** External link: absolute http(s) URL only (blocks javascript:, data:, etc.). */
export function IsHttpUrl(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isHttpUrl',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && value.length <= 500 && isURL(value, HTTP_URL_OPTIONS),
        defaultMessage: () => '$property debe ser una URL http(s) válida',
      },
    },
    options,
  );
}

/** Image or document: an uploaded local file or an https URL. */
export function IsMediaUrl(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isMediaUrl',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' &&
          value.length <= 500 &&
          (UPLOAD_PATH_PATTERN.test(value) || isURL(value, { ...HTTP_URL_OPTIONS, protocols: ['https'] })),
        defaultMessage: () => '$property debe ser un archivo subido (/uploads/...) o una URL https',
      },
    },
    options,
  );
}
