
/**
 * Generates a short random alphanumeric ID.
 */
export const generateId = (): string => Math.random().toString(36).substr(2, 9);
