// Turns a value into an array if it's not already an array
export const arrayify = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value])
