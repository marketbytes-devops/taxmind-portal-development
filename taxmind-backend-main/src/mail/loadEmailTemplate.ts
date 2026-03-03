import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';

export const loadTemplate = (templateName: string, variables: unknown) => {
  const filePath = path.join(__dirname, '/templates', `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf8');
  const template = handlebars.compile(source);
  return template(variables);
};
