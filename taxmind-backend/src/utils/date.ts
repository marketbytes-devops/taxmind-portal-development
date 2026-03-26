export const isDateValid = (date: string) => !isNaN(new Date(date).getTime());

export const isDateAfterTodaysDate = (date: Date) => {
  const inputDate = new Date(date);
  const todaysDate = new Date();
  const isDateEqualsToday = inputDate.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0);

  return inputDate > todaysDate || isDateEqualsToday;
};
