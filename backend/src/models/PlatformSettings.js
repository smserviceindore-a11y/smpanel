const mongoose = require('mongoose');

/**
 * Singleton platform config (key: default).
 * Tabs in Super Admin: Payments | Email | Invoice/Company | Media | Wallet
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    payments: {
      provider: { type: String, enum: ['razorpay', 'mock'], default: 'razorpay' },
      /** When true → use testKey*; when false → use liveKey* (for post-approval go-live) */
      testMode: { type: Boolean, default: true },
      testKeyId: { type: String, default: '' },
      testKeySecret: { type: String, default: '' },
      liveKeyId: { type: String, default: '' },
      liveKeySecret: { type: String, default: '' },
      /** Legacy single key fields (migrated into test/live) */
      razorpayKeyId: { type: String, default: '' },
      razorpayKeySecret: { type: String, default: '' },
      enabled: { type: Boolean, default: true },
      allowDemoPay: { type: Boolean, default: true },
      refundHoldDays: { type: Number, default: 14, min: 0, max: 90 },
      holdStartMode: {
        type: String,
        enum: ['from_payment', 'from_delivery'],
        default: 'from_payment',
      },
      couponAdminBearPercent: { type: Number, default: 80, min: 0, max: 100 },
      couponDeveloperBearPercent: { type: Number, default: 20, min: 0, max: 100 },
      /** Max payout requests per developer per rolling 24h */
      maxPayoutRequestsPerDay: { type: Number, default: 3, min: 1, max: 50 },
      /** Max single payout amount (INR); 0 = no limit */
      maxPayoutAmount: { type: Number, default: 500000, min: 0 },
    },
    smtp: {
      enabled: { type: Boolean, default: false },
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: '' },
      pass: { type: String, default: '' },
      fromName: { type: String, default: 'SM Global Hub' },
      fromEmail: { type: String, default: '' },
    },
    company: {
      legalName: { type: String, default: 'SM Global Tech Solutions' },
      tradeName: { type: String, default: 'SM Global Solution Hub' },
      registeredAddress: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
      gstin: { type: String, default: '' },
      pan: { type: String, default: '' },
      stateCode: { type: String, default: '' },
      stateName: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      accountType: { type: String, default: 'Current' },
      ifsc: { type: String, default: '' },
      branch: { type: String, default: '' },
      invoicePrefix: { type: String, default: 'SM' },
      invoiceNotes: {
        type: String,
        default:
          '1. All disputes shall be subject to the local jurisdiction only.\n2. Interest @18% p.a. may be charged on delayed payments.\n3. Goods once sold will not be taken back unless defective.\n4. Subject to terms of service on our website.',
      },
      authorisedSignatoryLabel: { type: String, default: 'Authorised Signatory' },
    },
    cloudinary: {
      cloudName: { type: String, default: '' },
      apiKey: { type: String, default: '' },
      apiSecret: { type: String, default: '' },
      enabled: { type: Boolean, default: true },
    },
    billing: {
      platformGstin: { type: String, default: '' },
      defaultTaxPercent: { type: Number, default: 18, min: 0, max: 40 },
      defaultHsnSac: { type: String, default: '998314' },
      placeOfSupply: { type: String, default: '' },
      /** auto = derive from GSTIN state codes; same_state / interstate override */
      taxMode: {
        type: String,
        enum: ['auto', 'same_state', 'interstate'],
        default: 'auto',
      },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
