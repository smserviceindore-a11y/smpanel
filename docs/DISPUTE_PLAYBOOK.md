# Dispute / chargeback playbook

Use this when a buyer disputes a payment (Razorpay chargeback, bank dispute, or refund request).

## Immediate (same day)

1. **Freeze related payout** — Open Admin → Settlements. If the developer wallet credit is still on hold or reserved, do **not** mark the payout paid. Reject or hold the payout request tied to that transaction.
2. **Record the case** — Note `transactionId`, `invoiceId`, `quotationId`, Razorpay payment id, client email, and reason in an internal ticket (Support) or spreadsheet.
3. **Contact Razorpay** — Dashboard → Payments → find payment → respond to dispute with invoice PDF, delivery proof (`deliveryAccessUrl` / email trail), and quotation acceptance.

## Refund decision

| Situation | Action |
|-----------|--------|
| Product not delivered / broken access | Full refund via Admin Refunds; then reverse wallet credit if already released |
| Buyer remorse after delivery | Partial or decline per Terms; document decision |
| Fraud / duplicate charge | Full refund + block client if needed |

Until **gateway refunds (P0)** are live, Admin refunds update ledger only — also issue the Razorpay refund manually from the dashboard so money returns to the buyer.

## Checklist

- [ ] Payout frozen / not paid
- [ ] Invoice + quotation PDF attached to dispute response
- [ ] Delivery evidence collected (or acknowledged missing)
- [ ] Ledger refund recorded in Admin
- [ ] Razorpay refund / dispute reply submitted
- [ ] Client and developer notified
- [ ] Audit log / Support ticket updated

## Related

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — P0.3 gateway refunds, P1.6 disputes
- [STAGING.md](./STAGING.md) — test disputes only on Razorpay test mode
