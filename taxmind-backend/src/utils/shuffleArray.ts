export function shuffleArray(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

interface Item {
  id: string;
  type: string;
}

export function shuffleArrayWithTypeFirst(items: Item[], firstType: string): Item[] {
  // Separate items by type
  const firstTypeItems = items.filter((item) => item.type === firstType);
  const otherTypeItems = items.filter((item) => item.type !== firstType);

  // Shuffle helper function
  function shuffle(array: Item[]): Item[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Shuffle both arrays
  const shuffledFirstTypeItems = shuffle(firstTypeItems);
  const shuffledOtherTypeItems = shuffle(otherTypeItems);

  // Ensure the first item is of the specified type
  if (shuffledFirstTypeItems.length === 0) {
    throw new Error(`No items of type "${firstType}" found in the array.`);
  }

  const result: Item[] = [];
  let firstTypeIndex = 0;
  let otherIndex = 0;

  // Merge the two arrays ensuring no adjacent items of the same type
  while (
    firstTypeIndex < shuffledFirstTypeItems.length ||
    otherIndex < shuffledOtherTypeItems.length
  ) {
    if (result.length > 0 && result[result.length - 1].type === firstType) {
      // Add an item from the other type to avoid adjacent same types
      if (otherIndex < shuffledOtherTypeItems.length) {
        result.push(shuffledOtherTypeItems[otherIndex++]);
      } else {
        // If no other type items left, add remaining first type items
        result.push(shuffledFirstTypeItems[firstTypeIndex++]);
      }
    } else {
      // Alternate between adding first type and other types
      if (firstTypeIndex < shuffledFirstTypeItems.length) {
        result.push(shuffledFirstTypeItems[firstTypeIndex++]);
      } else if (otherIndex < shuffledOtherTypeItems.length) {
        result.push(shuffledOtherTypeItems[otherIndex++]);
      }
    }
  }

  return result;
}
