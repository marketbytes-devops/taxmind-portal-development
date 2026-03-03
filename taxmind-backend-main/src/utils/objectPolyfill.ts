/* eslint-disable no-unused-vars */
declare global {
  interface ObjectConstructor {
    groupBy<T>(array: T[], callback: (item: T) => string | number): Record<string | number, T[]>;
  }
}

export {};

Object.groupBy = function <T>(
  array: T[],
  callback: (item: T) => string | number
): Record<string | number, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = callback(item);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string | number, T[]>
  );
};
