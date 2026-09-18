# College demo — 2-minute money story

Local URLs: Frontend `http://localhost:5173` · API `http://localhost:5001/api`

## Before you start

```bash
cd backend && npm run seed:money
```

(Or full `npm run seed` — money story is included.)

Demo logins: see [CREDENTIALS.md](../CREDENTIALS.md).

Seeded IDs (idempotent):

| Kind | ID | Meaning |
|------|-----|---------|
| Quotation | `QT-DEMO01` | Recent paid order (developer share on hold) |
| Quotation | `QT-DEMO02` | Older paid order (hold released → available) |
| Transaction | `TXN-DEMO01` / `TXN-DEMO02` | Matching paid txns |
| Invoice | `INV-DEMO01` / `INV-DEMO02` | Client invoices |
| Payout | `PO-DEMO01` | Pending (UPI) |
| Payout | `PO-DEMO02` | Approved — admin can **Mark paid** |
| Contacts | subjects `[DEMO] …` | Contact inbox samples |

---

## Walkthrough (~2 min)

1. **Client** (`client@demo.com`) → Quotations / Invoices  
   - Show paid quotes + invoice PDFs (`INV-DEMO*`).

2. **Developer** (`rahul.dev@smglobalhub.com`) → **Wallet & Payouts**  
   - **Available** vs **On hold** status strip.  
   - Open payouts: `PO-DEMO01` pending, `PO-DEMO02` approved.

3. **Admin / Super Admin** → Settlements → Payout requests  
   - Approve pending or **Mark paid** on `PO-DEMO02` (debits wallet).

4. **Super Admin** → Payment Reports  
   - Summary + developer report for Rahul + transactions `TXN-DEMO*`.

5. **Public** `/contact` → submit a message → **Admin → Contact Inbox**  
   - Mark read / replied (seeded `[DEMO]` rows already there).

---

## Flow diagram

```text
Client pay → Invoice → Wallet hold → (days) Available → Payout request → Admin approve → Mark paid
```

---

## Deferred (not in this demo polish)

Choose later when you need them:

- **Phase 4 AI** — recommendations / assist  
- **Production deploy** — own server / public URL  

Until then, local `:5173` + `:5001` is enough for viva.
