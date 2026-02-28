/**
 * Generates a random alphanumeric ID string.
 */
export const generateId = (): string =>
  Math.random().toString(36).substring(2, 11);
