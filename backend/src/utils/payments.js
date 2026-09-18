const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getPaymentConfig } = require('../services/settings.service');

let client;
let clientKeyFingerprint = '';

const fingerprint = (id, secret) => `${id}:${secret?.slice(-6) || ''}`;

const getRazorpayClient = async () => {
  const cfg = await getPaymentConfig();
  if (cfg.provider !== 'razorpay' || !cfg.keyId || !cfg.keySecret) return null;

  const fp = fingerprint(cfg.keyId, cfg.keySecret);
  if (!client || clientKeyFingerprint !== fp) {
    client = new Razorpay({
      key_id: cfg.keyId,
      key_secret: cfg.keySecret,
    });
    clientKeyFingerprint = fp;
  }
  return client;
};

const hasRazorpay = async () => {
  const cfg = await getPaymentConfig();
  return cfg.provider === 'razorpay' && Boolean(cfg.keyId && cfg.keySecret);
};

const createPaymentOrder = async ({ amount, currency = 'INR', receipt, notes }) => {
  const cfg = await getPaymentConfig();
  const rz = await getRazorpayClient();

  if (!rz || cfg.provider !== 'razorpay') {
    return {
      mode: 'mock',
      orderId: `order_mock_${Date.now()}`,
      amount,
      currency,
      keyId: null,
    };
  }

  const order = await rz.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt: String(receipt || `rcpt_${Date.now()}`).slice(0, 40),
    notes,
  });

  return {
    mode: 'razorpay',
    orderId: order.id,
    amount,
    currency,
    keyId: cfg.keyId,
  };
};

const verifyRazorpaySignature = async ({ orderId, paymentId, signature }) => {
  const cfg = await getPaymentConfig();
  if (!cfg.keySecret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', cfg.keySecret).update(body).digest('hex');
  return expected === signature;
};

module.exports = {
  hasRazorpay,
  createPaymentOrder,
  verifyRazorpaySignature,
  getRazorpayClient,
};
