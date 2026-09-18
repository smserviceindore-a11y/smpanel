require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { getOrCreateSettings, clearPaymentCache } = require('./src/services/settings.service');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    await getOrCreateSettings();
    clearPaymentCache();
    console.log('Platform settings ready (Razorpay from DB/env)');
  } catch (e) {
    console.warn('Settings bootstrap skipped:', e.message);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
});
