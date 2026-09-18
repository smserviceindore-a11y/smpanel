const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`Warning: Missing env variables: ${missing.join(', ')}`);
  }
};

module.exports = { validateEnv };
