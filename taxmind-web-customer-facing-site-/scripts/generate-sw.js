const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the template file
const templatePath = path.join(__dirname, '../public/firebase-messaging-sw.template.js');
const outputPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

console.log('Generating Firebase service worker...');
console.log('Environment variables check:');
console.log('VUE_APP_FIREBASE_API_KEY:', process.env.VUE_APP_FIREBASE_API_KEY ? 'Found' : 'Missing');
console.log('VUE_APP_FIREBASE_PROJECT_ID:', process.env.VUE_APP_FIREBASE_PROJECT_ID ? 'Found' : 'Missing');

try {
  let template = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders with environment variables
  const replacements = {
    '{{VUE_APP_FIREBASE_API_KEY}}': process.env.VUE_APP_FIREBASE_API_KEY || '',
    '{{VUE_APP_FIREBASE_AUTH_DOMAIN}}': process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || '',
    '{{VUE_APP_FIREBASE_PROJECT_ID}}': process.env.VUE_APP_FIREBASE_PROJECT_ID || '',
    '{{VUE_APP_FIREBASE_STORAGE_BUCKET}}': process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || '',
    '{{VUE_APP_FIREBASE_MESSAGING_SENDER_ID}}': process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    '{{VUE_APP_FIREBASE_APP_ID}}': process.env.VUE_APP_FIREBASE_APP_ID || '',
    '{{VUE_APP_FIREBASE_MEASUREMENT_ID}}': process.env.VUE_APP_FIREBASE_MEASUREMENT_ID || ''
  };

  // Check for missing critical values
  const criticalVars = ['VUE_APP_FIREBASE_API_KEY', 'VUE_APP_FIREBASE_PROJECT_ID', 'VUE_APP_FIREBASE_MESSAGING_SENDER_ID', 'VUE_APP_FIREBASE_APP_ID'];
  const missingVars = criticalVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Warning: Missing critical Firebase environment variables:', missingVars);
    console.warn('Service worker may not function properly.');
  }

  // Replace all placeholders
  Object.keys(replacements).forEach(placeholder => {
    template = template.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
  });

  // Write the generated file
  fs.writeFileSync(outputPath, template, 'utf8');
  console.log('✅ Firebase service worker generated successfully at:', outputPath);

} catch (error) {
  console.error('❌ Error generating Firebase service worker:', error.message);
  process.exit(1);
}
