/**
 * GST helpers — state code from GSTIN (first 2 digits).
 * Business rule: customer price is final (no GST on top).
 * Invoice shows GST extracted from that price; GST cost is borne by
 * platform + developer shares proportionally.
 */
const stateCodeFromGstin = (gstin = '') => {
  const g = String(gstin || '')
    .trim()
    .toUpperCase();
  if (g.length >= 2 && /^\d{2}/.test(g)) return g.slice(0, 2);
  return '';
};

/** Reverse-calculate taxable + tax from GST-inclusive customer payment */
const extractInclusiveGst = (gross, taxPercent = 0) => {
  const g = Math.max(0, Math.round(Number(gross) || 0));
  const p = Math.max(0, Number(taxPercent) || 0);
  if (p <= 0 || g <= 0) {
    return { taxableValue: g, taxAmount: 0, gross: g };
  }
  const taxableValue = Math.round(g / (1 + p / 100));
  const taxAmount = g - taxableValue;
  return { taxableValue, taxAmount, gross: g };
};

/**
 * Decide CGST+SGST vs IGST.
 * Prefer GSTIN state codes; fall back to taxMode setting.
 */
const resolveTaxSplit = ({
  sellerGstin,
  buyerGstin,
  sellerStateCode,
  taxMode = 'auto',
  taxAmount = 0,
}) => {
  const seller =
    stateCodeFromGstin(sellerGstin) || String(sellerStateCode || '').padStart(2, '0').slice(0, 2);
  const buyer = stateCodeFromGstin(buyerGstin);
  let mode = taxMode;
  if (mode === 'auto') {
    if (seller && buyer) {
      mode = seller === buyer ? 'same_state' : 'interstate';
    } else {
      mode = 'same_state';
    }
  }
  const tax = Math.max(0, Math.round(Number(taxAmount) || 0));
  if (mode === 'interstate') {
    return { mode: 'interstate', cgst: 0, sgst: 0, igst: tax, placeHint: buyer || seller };
  }
  const cgst = Math.floor(tax / 2);
  const sgst = tax - cgst;
  return { mode: 'same_state', cgst, sgst, igst: 0, placeHint: seller || buyer };
};

/** Split GST liability between platform and developer by their share ratio */
const allocateGstBear = ({
  gstAmount = 0,
  platformCommission = 0,
  developerShare = 0,
  hasDeveloper = false,
}) => {
  const gst = Math.max(0, Math.round(Number(gstAmount) || 0));
  if (gst <= 0) {
    return { platformGstBear: 0, developerGstBear: 0 };
  }
  if (!hasDeveloper || !(Number(developerShare) > 0)) {
    return { platformGstBear: gst, developerGstBear: 0 };
  }
  const p = Math.max(0, Number(platformCommission) || 0);
  const d = Math.max(0, Number(developerShare) || 0);
  const sum = p + d || 1;
  const platformGstBear = Math.round((gst * p) / sum);
  const developerGstBear = gst - platformGstBear;
  return { platformGstBear, developerGstBear };
};

/** Scale line items so amounts sum to taxableValue (keeps invoice table consistent) */
const scaleItemsToTaxable = (items = [], taxableValue = 0, fallbackTitle = 'Services') => {
  const target = Math.max(0, Math.round(Number(taxableValue) || 0));
  const list =
    Array.isArray(items) && items.length > 0
      ? items
      : [{ description: fallbackTitle, quantity: 1, unitAmount: target, amount: target }];
  const sum = list.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 1;
  let allocated = 0;
  return list.map((it, idx) => {
    const qty = Math.max(1, Number(it.quantity) || 1);
    const amount =
      idx === list.length - 1
        ? Math.max(0, target - allocated)
        : Math.round(((Number(it.amount) || 0) / sum) * target);
    allocated += amount;
    return {
      description: String(it.description || fallbackTitle).trim() || fallbackTitle,
      quantity: qty,
      unitAmount: Math.round(amount / qty),
      amount,
      uom: it.uom || 'NOS',
    };
  });
};

/** Round to nearest INR; returns { rounded, roundOff } */
const roundToInr = (amount) => {
  const n = Number(amount) || 0;
  const rounded = Math.round(n);
  return { rounded, roundOff: Math.round((rounded - n) * 100) / 100 };
};

const numberToWordsInr = (num) => {
  const n = Math.round(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero';
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x) => {
    if (x < 20) return ones[x];
    return `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ''}`.trim();
  };
  const three = (x) => {
    if (x < 100) return two(x);
    return `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? ` ${two(x % 100)}` : ''}`.trim();
  };
  let rem = n;
  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const parts = [];
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${three(lakh)} Lakh`);
  if (thousand) parts.push(`${three(thousand)} Thousand`);
  if (rem) parts.push(three(rem));
  return parts.join(' ');
};

module.exports = {
  stateCodeFromGstin,
  extractInclusiveGst,
  resolveTaxSplit,
  allocateGstBear,
  scaleItemsToTaxable,
  roundToInr,
  numberToWordsInr,
};
