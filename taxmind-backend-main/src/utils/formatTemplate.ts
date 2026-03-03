/**
 * Replaces placeholders in a template string with corresponding values from a replacements object.
 *
 * @param {string} template - The template string containing placeholders in the format {key}.
 * @param {Object} replacements - An object containing key-value pairs where the key matches the placeholders in the template.
 * @returns {string} - The formatted string with placeholders replaced by corresponding values from the replacements.
 *
 * @example
 * const template = 'Hello, {{username}}!';
 * const replacements = { username: 'JohnDoe' };
 * const result = formatTemplate(template, replacements);
 * console.log(result); // Outputs: 'Hello, JohnDoe!'
 */
export const formatTemplate = (template: string, replacements: { [x: string]: unknown }) =>
  template.replace(/{{(\w+)}}/g, (_, key) =>
    replacements[key] !== undefined ? `${replacements[key]}` : ''
  );
