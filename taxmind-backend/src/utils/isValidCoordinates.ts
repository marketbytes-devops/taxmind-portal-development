import { isValidFloat } from './isValidFloat';

export const isValidCoordinates = (coordinates: string[]) => {
  // Split each coordinate pair by space
  const pairs = coordinates.map((pair) => pair.split(' '));

  // Check if each pair contains exactly two parts and both are valid floats
  return pairs.every((pair) => pair.length === 2 && pair.every(isValidFloat));
};
