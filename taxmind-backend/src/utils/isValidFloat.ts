export const isValidFloat = (input: string) => {
  // const floatRegex = /^[-+]?[0-9]*\.?[0-9]+$/;
  // return floatRegex.test(input);
  const n = +input;
  return Number(n) === n && n % 1 !== 0;
};
