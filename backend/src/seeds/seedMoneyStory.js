/**
 * Idempotent demo money-story seed:
 * Client paid → invoice → developer hold + available → pending/approved payouts
 * + sample contact inbox messages.
 *
 * Safe to re-run: skips when QT-DEMO01 already exists.
 */
const User = require('../models/User');
const Project = require('../models/Project');
const Quotation = require('../models/Quotation');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const DeveloperWallet = require('../models/DeveloperWallet');
const WalletLedger = require('../models/WalletLedger');
const PayoutRequest = require('../models/PayoutRequest');
const ContactMessage = require('../models/ContactMessage');

const DEMO_QT = 'QT-DEMO01';
const DEMO_QT_OLD = 'QT-DEMO02';
const DEMO_TXN = 'TXN-DEMO01';
const DEMO_TXN_OLD = 'TXN-DEMO02';
const DEMO_INV = 'INV-DEMO01';
const DEMO_INV_OLD = 'INV-DEMO02';
const DEMO_PO_PENDING = 'PO-DEMO01';
const DEMO_PO_APPROVED = 'PO-DEMO02';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const seedMoneyStory = async () => {
  const developer = await User.findOne({ email: 'rahul.dev@smglobalhub.com' });
  const client = await User.findOne({ email: 'client@demo.com' });
  const admin = await User.findOne({
    email: { $in: ['ops@smglobal.com', 'superadmin@smglobal.com'] },
  });

  if (!developer || !client) {
    console.log('Money story seed skipped — demo developer/client missing (run role/dev seeds first)');
    return { skipped: true };
  }

  const project =
    (await Project.findOne({
      developerId: developer._id,
      status: { $in: ['published', 'featured'] },
    })) ||
    (await Project.findOne({ ownerType: 'developer', status: { $in: ['published', 'featured'] } }));

  const existing = await Quotation.findOne({ quotationId: DEMO_QT });
  if (existing) {
    console.log('Money story already seeded (QT-DEMO01) — skipping finance rows');
  } else {
    const commissionRate = 30;
    const amountNew = 50000;
    const platformNew = Math.round((amountNew * commissionRate) / 100);
    const shareNew = amountNew - platformNew;

    const amountOld = 30000;
    const platformOld = Math.round((amountOld * commissionRate) / 100);
    const shareOld = amountOld - platformOld;

    const paidOldAt = daysAgo(20);
    const paidNewAt = daysAgo(2);

    const qtOld = await Quotation.create({
      quotationId: DEMO_QT_OLD,
      leadType: 'manual',
      projectId: project?._id,
      developerId: developer._id,
      clientId: client._id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone || '9000000003',
      clientCompany: client.profile?.company || 'Demo Buyer Pvt Ltd',
      title: 'Demo — Earlier customization (released hold)',
      items: [
        {
          description: 'Module customization (demo seed)',
          quantity: 1,
          unitAmount: amountOld,
          amount: amountOld,
        },
      ],
      subtotal: amountOld,
      taxPercent: 0,
      taxAmount: 0,
      total: amountOld,
      paidAmount: amountOld,
      status: 'paid',
      commissionRate,
      createdBy: admin?._id,
      notes: 'Seeded for college demo money story',
      createdAt: daysAgo(25),
      updatedAt: paidOldAt,
    });

    const qtNew = await Quotation.create({
      quotationId: DEMO_QT,
      leadType: 'manual',
      projectId: project?._id,
      developerId: developer._id,
      clientId: client._id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone || '9000000003',
      clientCompany: client.profile?.company || 'Demo Buyer Pvt Ltd',
      title: 'Demo — Recent paid order (on hold)',
      items: [
        {
          description: 'Full project license + setup (demo seed)',
          quantity: 1,
          unitAmount: amountNew,
          amount: amountNew,
        },
      ],
      subtotal: amountNew,
      taxPercent: 0,
      taxAmount: 0,
      total: amountNew,
      paidAmount: amountNew,
      status: 'paid',
      commissionRate,
      createdBy: admin?._id,
      notes: 'Seeded for college demo money story',
      deliveredAt: daysAgo(1),
      deliveredBy: admin?._id,
      createdAt: daysAgo(5),
      updatedAt: paidNewAt,
    });

    const txnOld = await Transaction.create({
      transactionId: DEMO_TXN_OLD,
      quotationId: qtOld._id,
      clientId: client._id,
      developerId: developer._id,
      amount: amountOld,
      commissionRate,
      platformCommission: platformOld,
      developerShare: shareOld,
      paymentMode: 'mock',
      status: 'paid',
      paidAt: paidOldAt,
      settlementStatus: 'pending',
      razorpayPaymentId: 'demo_seed_old',
      createdAt: paidOldAt,
      updatedAt: paidOldAt,
    });

    const txnNew = await Transaction.create({
      transactionId: DEMO_TXN,
      quotationId: qtNew._id,
      clientId: client._id,
      developerId: developer._id,
      amount: amountNew,
      commissionRate,
      platformCommission: platformNew,
      developerShare: shareNew,
      paymentMode: 'mock',
      status: 'paid',
      paidAt: paidNewAt,
      settlementStatus: 'pending',
      razorpayPaymentId: 'demo_seed_new',
      createdAt: paidNewAt,
      updatedAt: paidNewAt,
    });

    await Invoice.create({
      invoiceId: DEMO_INV_OLD,
      quotationId: qtOld._id,
      transactionId: txnOld._id,
      clientId: client._id,
      clientName: client.name,
      clientEmail: client.email,
      title: qtOld.title,
      items: qtOld.items,
      subtotal: amountOld,
      taxAmount: 0,
      total: amountOld,
      status: 'paid',
      issuedAt: paidOldAt,
      paidAt: paidOldAt,
    });

    await Invoice.create({
      invoiceId: DEMO_INV,
      quotationId: qtNew._id,
      transactionId: txnNew._id,
      clientId: client._id,
      clientName: client.name,
      clientEmail: client.email,
      title: qtNew.title,
      items: qtNew.items,
      subtotal: amountNew,
      taxAmount: 0,
      total: amountNew,
      status: 'paid',
      issuedAt: paidNewAt,
      paidAt: paidNewAt,
    });

    // Wallet: old share released to available; new share still on hold.
    // Pending/approved payouts do NOT debit until admin marks paid.
    const pendingPayoutAmt = 10000;
    const approvedPayoutAmt = 5000;
    const availableBalance = shareOld;
    const holdBalance = shareNew;

    await DeveloperWallet.findOneAndUpdate(
      { developerId: developer._id },
      {
        $set: {
          availableBalance,
          holdBalance,
          currency: 'INR',
        },
      },
      { upsert: true, new: true }
    );

    const holdUntilOld = daysAgo(6);
    const holdUntilNew = daysFromNow(12);

    await WalletLedger.create({
      developerId: developer._id,
      type: 'credit_hold',
      amount: shareOld,
      status: 'available',
      holdUntil: holdUntilOld,
      transactionId: txnOld._id,
      quotationId: qtOld._id,
      projectId: project?._id,
      note: 'Demo seed — hold matured',
      createdAt: paidOldAt,
    });
    await WalletLedger.create({
      developerId: developer._id,
      type: 'release_available',
      amount: shareOld,
      status: 'available',
      holdUntil: holdUntilOld,
      transactionId: txnOld._id,
      quotationId: qtOld._id,
      projectId: project?._id,
      note: 'Demo seed — released to available',
      createdAt: holdUntilOld,
    });
    await WalletLedger.create({
      developerId: developer._id,
      type: 'credit_hold',
      amount: shareNew,
      status: 'hold',
      holdUntil: holdUntilNew,
      transactionId: txnNew._id,
      quotationId: qtNew._id,
      projectId: project?._id,
      note: 'Demo seed — currently on hold',
      createdAt: paidNewAt,
    });

    await PayoutRequest.create({
      payoutId: DEMO_PO_PENDING,
      developerId: developer._id,
      amount: pendingPayoutAmt,
      method: 'upi',
      details: { upiId: 'rahul@upi' },
      status: 'pending',
      createdAt: daysAgo(1),
    });

    await PayoutRequest.create({
      payoutId: DEMO_PO_APPROVED,
      developerId: developer._id,
      amount: approvedPayoutAmt,
      method: 'bank',
      details: {
        accountName: 'Rahul Sharma',
        accountNumber: 'XXXXXXXX1234',
        ifsc: 'HDFC0001234',
      },
      status: 'approved',
      reviewedBy: admin?._id,
      reviewedAt: daysAgo(0),
      adminNotes: 'Demo seed — approved, ready to mark paid',
      createdAt: daysAgo(3),
    });

    console.log(
      `Money story seeded: ${DEMO_QT}/${DEMO_TXN} hold ₹${shareNew}, available ₹${availableBalance}, payouts ${DEMO_PO_PENDING}+${DEMO_PO_APPROVED}`
    );
  }

  // Contact inbox samples
  const contactSeeds = [
    {
      name: 'Ananya Mehta',
      email: 'ananya.demo@example.com',
      phone: '9811100001',
      subject: '[DEMO] Interested in ERP demo',
      message: 'We need an inventory + billing demo for our factory. Please call this week.',
      status: 'new',
    },
    {
      name: 'Vikram Shah',
      email: 'vikram.demo@example.com',
      phone: '9811100002',
      subject: '[DEMO] Customization quote follow-up',
      message: 'Following up on the SaaS customization quote sent last week.',
      status: 'read',
    },
    {
      name: 'Neha Kapoor',
      email: 'neha.demo@example.com',
      subject: '[DEMO] Partnership enquiry',
      message: 'Can SM Global list our college project on the marketplace?',
      status: 'replied',
    },
  ];

  let contactsCreated = 0;
  for (const c of contactSeeds) {
    const exists = await ContactMessage.findOne({ subject: c.subject, email: c.email });
    if (!exists) {
      await ContactMessage.create(c);
      contactsCreated += 1;
    }
  }
  if (contactsCreated) {
    console.log(`Contact inbox seeded: ${contactsCreated} new message(s)`);
  } else {
    console.log('Contact inbox demo messages already present');
  }

  return { skipped: Boolean(existing) };
};

module.exports = seedMoneyStory;
