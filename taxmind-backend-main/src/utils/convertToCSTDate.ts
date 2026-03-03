export const convertToCSTDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
