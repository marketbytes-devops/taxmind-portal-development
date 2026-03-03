export const getValuesInRange = (arr: string[], min: number, max: number) =>
  arr.filter((value) => {
    const numericValue = parseFloat(value);
    return numericValue >= min && numericValue <= max;
  });
