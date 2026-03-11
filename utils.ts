
/**
 * Generates a random alphanumeric ID string (9 characters).
 */
export const generateId = (): string => Math.random().toString(36).substring(2, 11);
