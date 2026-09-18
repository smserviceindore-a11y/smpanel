const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, unique: true, required: true },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientName: String,
    clientEmail: String,
    clientPhone: String,
    clientCompany: String,
    clientAddress: String,
    clientGstin: String,
    title: String,
    items: [
      {
        description: String,
        quantity: Number,
        unitAmount: Number,
        amount: Number,
        uom: { type: String, default: 'NOS' },
      },
    ],
    subtotal: Number,
    taxAmount: Number,
    total: Number,
    /** Coupon / list price (customer-facing, GST not added on top) */
    originalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    /** Nearest-INR adjustment applied to payable */
    roundOff: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    gstin: String,
    placeOfSupply: String,
    hsnSac: String,
    taxableValue: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    taxPercent: Number,
    taxMode: { type: String, enum: ['same_state', 'interstate', 'auto'], default: 'auto' },
    /** Snapshot of company / bank at issue time */
    companySnapshot: {
      legalName: String,
      tradeName: String,
      registeredAddress: String,
      phone: String,
      email: String,
      website: String,
      gstin: String,
      pan: String,
      stateCode: String,
      stateName: String,
      bankName: String,
      accountName: String,
      accountNumber: String,
      accountType: String,
      ifsc: String,
      branch: String,
      invoiceNotes: String,
      authorisedSignatoryLabel: String,
    },
    status: {
      type: String,
      enum: ['issued', 'paid', 'void'],
      default: 'issued',
    },
    issuedAt: { type: Date, default: Date.now },
    paidAt: Date,
  },
  { timestamps: true }
);

invoiceSchema.index({ clientId: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
