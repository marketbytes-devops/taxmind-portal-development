// Dynamic environment file selection
// Priority:
// 1. NODE_ENV mapping -> production|staging|development specific file
// 2. Fallback to .env
const resolveEnvFile = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '.env.production';
    case 'staging':
      return '.env.staging';
    case 'development':
      return '.env.development';
    default:
      return '.env';
  }
};

const envFile = resolveEnvFile();

module.exports = {
  apps: [
    {
      name: 'taxmind-api',
      script: 'dist/index.js',
      node_args: `--env-file=${envFile}`,
      env: { RESOLVED_ENV_FILE: envFile },
    },
  ],
};
