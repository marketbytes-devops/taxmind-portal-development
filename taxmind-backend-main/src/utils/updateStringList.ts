export const updateStringList = (stringList: string | null, newString: string) => {
  const stringSet = new Set(stringList ? stringList.split(',') : []);
  // console.log('current:', { stringSet });
  stringSet.add(newString);
  // console.log('new:', { stringSet });

  const updatedStringList = Array.from(stringSet).join(',');
  // console.log('updated:', updatedStringList);
  return updatedStringList;
};
