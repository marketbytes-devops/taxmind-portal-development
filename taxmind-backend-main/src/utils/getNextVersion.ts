export const getNextVersion = (currentVersion: string, bump: 'minor' | 'major') => {
  let [major, minor] = currentVersion.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0`;
  else return `${major}.${minor + 1}`;
};
