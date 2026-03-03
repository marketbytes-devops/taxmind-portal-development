const getRandomString = () => {
  return `${Date.now()}${Math.random().toString().replace('.', '')}`;
};

export default getRandomString;
