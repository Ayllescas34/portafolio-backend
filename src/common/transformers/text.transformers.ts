import { Transform } from 'class-transformer';

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[a-zA-Z][^>]*>/g;

/**
 * Content is stored as plain text and always rendered escaped by the frontend.
 * Stripping tags and control characters is defense in depth, not the primary
 * XSS protection.
 */
export function sanitizeText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '').replace(HTML_TAGS, '').trim();
}

/** Trims and sanitizes a required text field. */
export function SanitizedText(): PropertyDecorator {
  return Transform(({ value }) => sanitizeText(value));
}

/** Like SanitizedText, but an empty string becomes null (clears the field). */
export function NullableText(): PropertyDecorator {
  return Transform(({ value }) => {
    const clean = sanitizeText(value);
    return clean === '' ? null : clean;
  });
}

/** Lowercases and trims an email address. */
export function NormalizedEmail(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
}

/** Parses "true"/"false" query strings into booleans. */
export function QueryBoolean(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  });
}

/** Trims a URL-like value; empty becomes null. */
export function NullableUrl(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
}
