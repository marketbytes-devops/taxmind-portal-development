const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  currency: 'USD',
});

export const formatCurrency = (value: number) => {
  return formatter.format(value);
};
