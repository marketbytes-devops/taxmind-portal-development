export const checkForDuplicates = (array: unknown[]) => new Set(array).size !== array.length;
