export const SESSION_COOKIE = 'portfolio_session';
export const SESSION_COOKIE_PATH = '/api';
export const IS_PUBLIC_KEY = 'isPublic';

/** Stricter limits for endpoints that are attractive for abuse. */
export const LOGIN_THROTTLE = { default: { limit: 5, ttl: 60_000 } };
export const CONTACT_THROTTLE = { default: { limit: 3, ttl: 10 * 60_000 } };
