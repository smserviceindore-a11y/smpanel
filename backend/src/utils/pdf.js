const PDFDocument = require('pdfkit');
const {
  numberToWordsInr,
  extractInclusiveGst,
  resolveTaxSplit,
  stateCodeFromGstin,
  scaleItemsToTaxable,
} = require('./gst');

const NAVY = '#1a2332';
const MUTED = '#5c6570';
const LINE = '#d8dde3';
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const inrPlain = (n) => Number(n || 0).toLocaleString('en-IN');

const partyBlock = (doc, label, party, x, y, w) => {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text(label, x, y);
  let yy = y + 12;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text(party.name || '—', x, yy, { width: w });
  yy = doc.y + 2;
  doc.font('Helvetica').fontSize(8).fillColor(MUTED);
  [party.company, party.address, party.email, party.phone, party.gstin ? `GSTIN: ${party.gstin}` : '']
    .filter(Boolean)
    .forEach((line) => {
      doc.text(line, x, yy, { width: w });
      yy = doc.y + 1;
    });
  return yy;
};

/**
 * Clean modern Tax Invoice (Invoice Fly–inspired layout).
 * GST inclusive in customer total; CGST+SGST or IGST shown in summary.
 * Discount line when coupon applied.
 */
const buildTaxInvoicePdf = (payload = {}) =>
  new Promise((resolve, reject) => {
    let {
      invoiceId,
      issuedAt,
      title,
      status,
      company = {},
      client = {},
      shipTo = {},
      items = [],
      hsnSac = '998314',
      taxableValue = 0,
      taxPercent = 18,
      cgst = 0,
      sgst = 0,
      igst = 0,
      taxAmount = 0,
      roundOff = 0,
      total = 0,
      discountAmount = 0,
      originalAmount = 0,
      couponCode = '',
      notes,
      taxMode = 'auto',
    } = payload;

    const paid = Math.round(Number(total) || 0);
    const discount = Math.max(0, Math.round(Number(discountAmount) || 0));
    const listPrice = Math.max(
      paid,
      Math.round(Number(originalAmount) || 0) || paid + discount
    );

    // Ensure GST breakup exists (fixes old invoices with missing tax)
    let pct = Number(taxPercent) || 0;
    if (pct > 0 && !(Number(cgst) > 0) && !(Number(sgst) > 0) && !(Number(igst) > 0)) {
      const extracted = extractInclusiveGst(paid, pct);
      taxableValue = extracted.taxableValue;
      taxAmount = extracted.taxAmount;
      const split = resolveTaxSplit({
        sellerGstin: company.gstin,
        buyerGstin: client.gstin,
        sellerStateCode: company.stateCode || stateCodeFromGstin(company.gstin),
        taxMode,
        taxAmount,
      });
      cgst = split.cgst;
      sgst = split.sgst;
      igst = split.igst;
      taxMode = split.mode;
    }
    if (!(Number(taxableValue) > 0) && paid > 0) {
      const extracted = extractInclusiveGst(paid, pct);
      taxableValue = extracted.taxableValue;
      taxAmount = extracted.taxAmount || taxAmount;
    }

    const lineItems = scaleItemsToTaxable(
      items,
      taxableValue,
      title || 'Digital product / service'
    );

    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
      info: { Title: `Tax Invoice ${invoiceId}`, Author: company.legalName || 'SM Global' },
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const left = 48;
    const right = pageW - 48;
    const width = right - left;
    let y = 48;

    const brand = company.tradeName || company.legalName || 'SM Global Solution Hub';
    const dateStr = issuedAt
      ? new Date(issuedAt).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN');

    // —— Header: brand left, invoice badge right ——
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('TAX INVOICE', left, y);
    y = doc.y + 4;
    doc.font('Helvetica-Bold').fontSize(22).fillColor(NAVY).text(brand, left, y, { width: width * 0.55 });
    const brandBottom = doc.y;

    const badgeW = 150;
    const badgeX = right - badgeW;
    doc.save();
    doc.roundedRect(badgeX, 48, badgeW, 44, 4).fill(NAVY);
    doc.restore();
    doc.font('Helvetica').fontSize(8).fillColor('#fff').text('INVOICE NO.', badgeX + 12, 56);
    doc.font('Helvetica-Bold').fontSize(12).text(String(invoiceId || '—'), badgeX + 12, 68);
    doc.font('Helvetica').fontSize(8).text(dateStr, badgeX + 12, 84);

    y = Math.max(brandBottom, 100) + 6;
    doc.font('Helvetica').fontSize(8).fillColor(MUTED);
    const companyLines = [
      company.registeredAddress,
      [company.phone ? `Ph: ${company.phone}` : '', company.email || ''].filter(Boolean).join(' · '),
      company.gstin ? `GSTIN: ${company.gstin}` : '',
      company.pan ? `PAN: ${company.pan}` : '',
      company.stateCode ? `State code: ${company.stateCode}` : '',
    ].filter(Boolean);
    companyLines.forEach((line) => {
      doc.text(line, left, y, { width: width * 0.6 });
      y = doc.y + 1;
    });

    y += 10;
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .strokeColor(LINE)
      .lineWidth(1)
      .stroke();
    y += 14;

    // —— Bill to / Ship to ——
    const ship = shipTo?.name ? shipTo : client;
    const colW = (width - 24) / 2;
    const billEnd = partyBlock(doc, 'BILL TO', client, left, y, colW);
    const shipEnd = partyBlock(doc, 'SHIP TO', ship, left + colW + 24, y, colW);
    y = Math.max(billEnd, shipEnd) + 8;

    doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED);
    doc.text('Payment: Advance / Prepaid (digital delivery)', left, y, { width });
    if (status) doc.text(`Status: ${status}`, right - 120, y, { width: 120, align: 'right' });
    y = doc.y + 12;

    // —— Items table ——
    const cols = [
      { label: 'DESCRIPTION', w: width - 50 - 40 - 70 - 80, align: 'left' },
      { label: 'HSN', w: 50, align: 'left' },
      { label: 'QTY', w: 40, align: 'right' },
      { label: 'PRICE', w: 70, align: 'right' },
      { label: 'TOTAL', w: 80, align: 'right' },
    ];
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .strokeColor(NAVY)
      .lineWidth(1.2)
      .stroke();
    y += 8;
    let cx = left;
    cols.forEach((c) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(MUTED)
        .text(c.label, cx, y, { width: c.w, align: c.align });
      cx += c.w;
    });
    y += 14;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(LINE).lineWidth(0.8).stroke();
    y += 8;

    lineItems.forEach((it) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unit = Number(it.unitAmount ?? it.amount / qty) || 0;
      const amt = Number(it.amount ?? unit * qty) || 0;
      const desc = it.description || title || 'Item';
      const rowTop = y;
      doc.font('Helvetica').fontSize(9).fillColor(NAVY);
      doc.text(desc, left, y, { width: cols[0].w });
      const descH = doc.y - rowTop;
      cx = left + cols[0].w;
      doc.fontSize(8).fillColor(MUTED);
      doc.text(hsnSac || '—', cx, rowTop, { width: cols[1].w });
      cx += cols[1].w;
      doc.text(String(qty), cx, rowTop, { width: cols[2].w, align: 'right' });
      cx += cols[2].w;
      doc.text(inrPlain(unit), cx, rowTop, { width: cols[3].w, align: 'right' });
      cx += cols[3].w;
      doc.font('Helvetica-Bold').fillColor(NAVY).text(inrPlain(amt), cx, rowTop, {
        width: cols[4].w,
        align: 'right',
      });
      y = rowTop + Math.max(descH, 16) + 6;
      if (y > 700) {
        doc.addPage();
        y = 48;
      }
    });

    doc.moveTo(left, y).lineTo(right, y).strokeColor(LINE).lineWidth(0.8).stroke();
    y += 14;

    // —— Summary (right) ——
    const sumW = 220;
    const sumX = right - sumW;
    const halfRate = (pct || 0) / 2;
    const fullRate = pct || 0;

    const rows = [];
    if (discount > 0 && listPrice > paid) {
      rows.push({ label: 'LIST PRICE', value: inrPlain(listPrice), muted: true });
      rows.push({
        label: couponCode ? `DISCOUNT (${couponCode})` : 'DISCOUNT',
        value: `−${inrPlain(discount)}`,
        muted: false,
      });
    }
    rows.push({ label: 'SUBTOTAL (before tax)', value: inrPlain(taxableValue) });
    if (Number(cgst) > 0 || Number(sgst) > 0) {
      rows.push({ label: `CGST ${halfRate.toFixed(2)}%`, value: inrPlain(cgst) });
      rows.push({ label: `SGST ${halfRate.toFixed(2)}%`, value: inrPlain(sgst) });
    } else if (Number(igst) > 0 || (fullRate > 0 && Number(taxAmount) > 0)) {
      rows.push({
        label: `IGST ${fullRate.toFixed(2)}%`,
        value: inrPlain(Number(igst) > 0 ? igst : taxAmount),
      });
    } else if (fullRate > 0) {
      // Still show GST lines at 0 only if percent configured but amount somehow 0
      rows.push({ label: `CGST ${(fullRate / 2).toFixed(2)}%`, value: '0' });
      rows.push({ label: `SGST ${(fullRate / 2).toFixed(2)}%`, value: '0' });
    }
    if (Number(roundOff) !== 0) {
      rows.push({ label: 'ROUND OFF', value: inrPlain(roundOff) });
    }
    rows.push({ label: 'TOTAL AMOUNT', value: inrPlain(paid), bold: true });
    rows.push({ label: 'AMOUNT PAID', value: inrPlain(paid), bold: true });

    rows.forEach((r) => {
      doc
        .font(r.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(r.bold ? 10 : 8)
        .fillColor(r.muted ? MUTED : NAVY)
        .text(r.label, sumX, y, { width: sumW - 80 });
      doc.text(r.value, sumX + sumW - 80, y, { width: 80, align: 'right' });
      y += r.bold ? 16 : 13;
    });

    y += 6;
    doc
      .moveTo(sumX, y)
      .lineTo(right, y)
      .strokeColor(NAVY)
      .lineWidth(1.5)
      .stroke();
    y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('BALANCE DUE', sumX, y, {
      width: sumW - 80,
    });
    doc.text(inr(0), sumX + sumW - 80, y, { width: 80, align: 'right' });
    y += 20;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(`Amount in words: INR ${numberToWordsInr(paid)} Only`, left, y, { width: width * 0.55 });
    y = Math.max(y + 20, doc.y + 8);

    // —— Footer: Terms | Payment ——
    if (y > 680) {
      doc.addPage();
      y = 48;
    }
    doc.moveTo(left, y).lineTo(right, y).strokeColor(LINE).lineWidth(1).stroke();
    y += 14;

    const footW = (width - 24) / 2;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text('Terms & Conditions', left, y);
    doc.text('Payment information', left + footW + 24, y);
    y += 12;
    const noteText =
      notes ||
      company.invoiceNotes ||
      '1. This is a computer-generated tax invoice.\n2. All disputes subject to local jurisdiction.\n3. Digital goods / services — no physical dispatch.';
    const noteY = y;
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(noteText, left, y, {
      width: footW,
    });
    const payY = noteY;
    doc.font('Helvetica').fontSize(8).fillColor(NAVY);
    doc.text(brand, left + footW + 24, payY, { width: footW });
    doc.fontSize(7).fillColor(MUTED);
    doc.text(
      [
        company.bankName ? `Bank: ${company.bankName}` : null,
        company.accountName ? `A/c name: ${company.accountName}` : null,
        company.accountNumber
          ? `A/c: ${company.accountType || 'Current'} / ${company.accountNumber}`
          : null,
        company.ifsc ? `IFSC: ${company.ifsc}${company.branch ? ` · ${company.branch}` : ''}` : null,
      ]
        .filter(Boolean)
        .join('\n') || 'Bank details as per company settings',
      left + footW + 24,
      doc.y + 2,
      { width: footW }
    );

    y = Math.max(doc.y, noteY + 60) + 20;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(NAVY)
      .text("Receiver's signature", left, y + 24);
    doc.text(`For ${brand}`, right - 160, y, { width: 160, align: 'right' });
    doc
      .fontSize(7)
      .fillColor(MUTED)
      .text(company.authorisedSignatoryLabel || 'Authorised Signatory', right - 160, y + 28, {
        width: 160,
        align: 'right',
      });

    doc.end();
  });

/**
 * Legacy simple document PDF (quotations etc.)
 */
const buildDocumentPdf = ({
  docType = 'Quotation',
  docId,
  title,
  clientName,
  clientEmail,
  items = [],
  subtotal = 0,
  taxAmount = 0,
  total = 0,
  currency = 'INR',
  notes = '',
  status = '',
  gstin = '',
  placeOfSupply = '',
  hsnSac = '',
  taxableValue,
  cgst = 0,
  sgst = 0,
  igst = 0,
}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#0F3D3E').fontSize(20).text('SM Global Solution Hub', { continued: false });
    doc.moveDown(0.3);
    doc.fillColor('#666').fontSize(10).text(`${docType} · ${docId}`);
    if (status) doc.text(`Status: ${status}`);
    if (gstin) doc.text(`GSTIN: ${gstin}`);
    if (placeOfSupply) doc.text(`Place of supply: ${placeOfSupply}`);
    doc.moveDown();

    doc.fillColor('#111').fontSize(14).text(title || docType);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333');
    doc.text(`Client: ${clientName || '—'}`);
    doc.text(`Email: ${clientEmail || '—'}`);
    doc.moveDown();

    doc.fontSize(11).fillColor('#0F3D3E').text('Line items');
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor('#333');

    items.forEach((item, i) => {
      const line = `${i + 1}. ${item.description}  ×${item.quantity || 1}  ·  ${currency} ${Number(
        item.amount || 0
      ).toLocaleString('en-IN')}`;
      doc.text(line);
    });

    if (hsnSac) {
      doc.moveDown(0.3);
      doc.text(`HSN/SAC: ${hsnSac}`);
    }

    doc.moveDown();
    const base = taxableValue != null ? taxableValue : subtotal;
    doc.text(`Taxable value: ${currency} ${Number(base).toLocaleString('en-IN')}`);
    if (Number(cgst) > 0 || Number(sgst) > 0) {
      doc.text(`CGST: ${currency} ${Number(cgst).toLocaleString('en-IN')}`);
      doc.text(`SGST: ${currency} ${Number(sgst).toLocaleString('en-IN')}`);
    } else if (Number(igst) > 0) {
      doc.text(`IGST: ${currency} ${Number(igst).toLocaleString('en-IN')}`);
    } else if (Number(taxAmount) > 0) {
      doc.text(`Tax: ${currency} ${Number(taxAmount).toLocaleString('en-IN')}`);
    } else {
      doc.text(`Tax: ${currency} 0`);
    }
    doc.fontSize(12).fillColor('#0F3D3E').text(`Total: ${currency} ${Number(total).toLocaleString('en-IN')}`);

    if (notes) {
      doc.moveDown();
      doc.fontSize(9).fillColor('#666').text(`Notes: ${notes}`);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text('Generated by SM Global Solution Hub');
    doc.end();
  });

const sendPdf = (res, buffer, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
  res.send(buffer);
};

module.exports = { buildDocumentPdf, buildTaxInvoicePdf, sendPdf };
