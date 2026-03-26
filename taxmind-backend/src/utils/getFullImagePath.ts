export const getFullImagePath = (imgPath: string) => {
  if (!imgPath) return '';

  return `${process.env.AWS_S3_URL}/${imgPath}`;
};
