const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { validateEnv } = require('./config/env');
const errorHandler = require('./middleware/error.middleware');
const { apiRateLimit } = require('./middleware/rateLimit.middleware');
const { sendSuccess } = require('./utils/apiResponse');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const categoryRoutes = require('./routes/category.routes');
const requirementRoutes = require('./routes/requirement.routes');
const customizationRoutes = require('./routes/customization.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');

validateEnv();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRateLimit);

app.get('/api/health', (req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'SM Global Hub API is running');
});

app.get('/api/sitemap.xml', require('./controllers/marketplaceExtras.controller').sitemapXml);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/customization-requests', customizationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', require('./routes/contact.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.get('/api/developers/:id', require('./controllers/publicDeveloper.controller').getPublicDeveloperProfile);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', require('./routes/superAdmin.routes'));
app.use('/api/support', require('./routes/support.routes'));
app.use('/api/developer', require('./routes/developer.routes'));
app.use('/api/client', require('./routes/client.routes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
