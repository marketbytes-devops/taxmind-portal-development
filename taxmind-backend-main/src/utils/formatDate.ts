import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

/**
 * Formats a given date into a readable string with dynamic labels such as "Today", "Yesterday", "Tomorrow",
 * or a date in 'MM/DD/YYYY' format along with the time in 'hh:mm A' format.
 *
 * @param {Date|string|number} date - The date to format. Can be a Date object, a date string, or a timestamp.
 * @returns {string} The formatted date string.
 *
 * @example
 * // Returns 'Today · 06:50 PM' if the date is today.
 * formatDate(new Date());
 *
 * @example
 * // Returns 'Yesterday · 06:50 PM' if the date was yesterday.
 * formatDate(new Date(new Date().setDate(new Date().getDate() - 1)));
 *
 * @example
 * // Returns 'Tomorrow · 06:50 PM' if the date is tomorrow.
 * formatDate(new Date(new Date().setDate(new Date().getDate() + 1)));
 *
 * @example
 * // Returns '02/12/2024 · 06:50 PM' for a given specific date.
 * formatDate(new Date('2024-02-12T18:50:00'));
 */
export const formatDate = (date: Date) => {
  let dayLabel;
  const formattedTime = format(date, 'hh:mm a'); // Format the time as '06:50 PM'

  if (isToday(date)) {
    dayLabel = 'Today';
  } else if (isTomorrow(date)) {
    dayLabel = 'Tomorrow';
  } else if (isYesterday(date)) {
    dayLabel = 'Yesterday';
  } else {
    dayLabel = format(date, 'MM/dd/yyyy'); // Format the date as '02/12/2024'
  }

  return `${dayLabel} · ${formattedTime}`;
};
