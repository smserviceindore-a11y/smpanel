const DeveloperWallet = require('../models/DeveloperWallet');
const WalletLedger = require('../models/WalletLedger');
const { getOrCreateSettings } = require('./settings.service');

const getOrCreateWallet = async (developerId) => {
  let w = await DeveloperWallet.findOne({ developerId });
  if (!w) {
    w = await DeveloperWallet.create({ developerId });
  }
  return w;
};

const getHoldDays = async () => {
  const doc = await getOrCreateSettings();
  const days = doc.payments?.refundHoldDays;
  return Number.isFinite(days) ? days : 14;
};

/** Move matured hold ledger entries into available balance */
const releaseMaturedHolds = async (developerId) => {
  const now = new Date();
  const filter = {
    status: 'hold',
    type: 'credit_hold',
    holdUntil: { $lte: now },
  };
  if (developerId) filter.developerId = developerId;

  const matured = await WalletLedger.find(filter);
  for (const entry of matured) {
    const wallet = await getOrCreateWallet(entry.developerId);
    const amt = entry.amount || 0;
    if (amt <= 0) continue;
    if (wallet.holdBalance < amt) {
      wallet.holdBalance = Math.max(0, wallet.holdBalance);
    } else {
      wallet.holdBalance -= amt;
    }
    wallet.availableBalance += amt;
    await wallet.save();

    entry.status = 'available';
    await entry.save();

    await WalletLedger.create({
      developerId: entry.developerId,
      type: 'release_available',
      amount: amt,
      status: 'available',
      transactionId: entry.transactionId,
      quotationId: entry.quotationId,
      projectId: entry.projectId,
      note: `Hold released (${entry._id})`,
    });
  }
  return matured.length;
};

const creditDeveloperHold = async ({
  developerId,
  amount,
  transactionId,
  quotationId,
  projectId,
  note,
  holdUntil: holdUntilOverride,
}) => {
  if (!developerId || !amount || amount <= 0) return null;

  const holdDays = await getHoldDays();
  const holdUntil =
    holdUntilOverride || new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);

  const wallet = await getOrCreateWallet(developerId);
  wallet.holdBalance += amount;
  await wallet.save();

  const entry = await WalletLedger.create({
    developerId,
    type: 'credit_hold',
    amount,
    status: 'hold',
    holdUntil,
    transactionId,
    quotationId,
    projectId,
    note: note || 'Payment credit (on hold)',
  });

  return { wallet, entry, holdUntil, holdDays };
};

/** Lock available → reserved when developer requests payout */
const reserveAvailableForPayout = async ({ developerId, amount, payoutId, note }) => {
  await releaseMaturedHolds(developerId);
  const wallet = await getOrCreateWallet(developerId);
  if (wallet.availableBalance < amount) {
    const err = new Error('Insufficient available balance');
    err.statusCode = 400;
    throw err;
  }
  wallet.availableBalance -= amount;
  wallet.reservedBalance = (wallet.reservedBalance || 0) + amount;
  await wallet.save();

  const entry = await WalletLedger.create({
    developerId,
    type: 'payout',
    amount,
    status: 'reserved',
    payoutId,
    note: note || 'Payout reserved (pending admin)',
  });

  return { wallet, entry };
};

/** Restore reserved → available when payout is rejected */
const releasePayoutReservation = async ({ developerId, amount, payoutId, note }) => {
  const wallet = await getOrCreateWallet(developerId);
  const reservedEntry = await WalletLedger.findOne({
    payoutId,
    type: 'payout',
    status: 'reserved',
  });

  if (!reservedEntry) {
    // Legacy payout (created before reserve) — nothing locked
    return { wallet, entry: null, restored: false };
  }

  const amt = amount || reservedEntry.amount || 0;
  wallet.reservedBalance = Math.max(0, (wallet.reservedBalance || 0) - amt);
  wallet.availableBalance += amt;
  await wallet.save();

  reservedEntry.status = 'reversed';
  reservedEntry.note = note || `Payout reservation released (${reservedEntry.note || ''})`;
  await reservedEntry.save();

  return { wallet, entry: reservedEntry, restored: true };
};

/**
 * Mark payout paid:
 * - If reserved: finalize reserved → paid_out (no second debit)
 * - Else legacy: debit available
 */
const debitAvailableForPayout = async ({ developerId, amount, payoutId, note }) => {
  await releaseMaturedHolds(developerId);
  const wallet = await getOrCreateWallet(developerId);

  const reservedEntry = await WalletLedger.findOne({
    payoutId,
    type: 'payout',
    status: 'reserved',
  });

  if (reservedEntry) {
    const amt = amount || reservedEntry.amount || 0;
    wallet.reservedBalance = Math.max(0, (wallet.reservedBalance || 0) - amt);
    await wallet.save();
    reservedEntry.status = 'paid_out';
    reservedEntry.note = note || reservedEntry.note || 'Payout debit';
    await reservedEntry.save();
    return { wallet, entry: reservedEntry, fromReserve: true };
  }

  if (wallet.availableBalance < amount) {
    const err = new Error('Insufficient available balance');
    err.statusCode = 400;
    throw err;
  }
  wallet.availableBalance -= amount;
  await wallet.save();

  const entry = await WalletLedger.create({
    developerId,
    type: 'payout',
    amount,
    status: 'paid_out',
    payoutId,
    note: note || 'Payout debit',
  });

  return { wallet, entry, fromReserve: false };
};

const getWalletSummary = async (developerId) => {
  await releaseMaturedHolds(developerId);
  const wallet = await getOrCreateWallet(developerId);
  const holdDays = await getHoldDays();

  const byProject = await WalletLedger.aggregate([
    {
      $match: {
        developerId: wallet.developerId,
        type: { $in: ['credit_hold', 'release_available'] },
        status: { $in: ['hold', 'available', 'paid_out'] },
      },
    },
    {
      $group: {
        _id: '$projectId',
        hold: {
          $sum: { $cond: [{ $eq: ['$status', 'hold'] }, '$amount', 0] },
        },
        availableLike: {
          $sum: {
            $cond: [{ $in: ['$status', ['available', 'paid_out']] }, '$amount', 0],
          },
        },
        credited: {
          $sum: { $cond: [{ $eq: ['$type', 'credit_hold'] }, '$amount', 0] },
        },
      },
    },
  ]);

  return {
    availableBalance: wallet.availableBalance,
    holdBalance: wallet.holdBalance,
    reservedBalance: wallet.reservedBalance || 0,
    currency: wallet.currency,
    refundHoldDays: holdDays,
    byProject,
  };
};

module.exports = {
  getOrCreateWallet,
  getHoldDays,
  releaseMaturedHolds,
  creditDeveloperHold,
  reserveAvailableForPayout,
  releasePayoutReservation,
  debitAvailableForPayout,
  getWalletSummary,
};
