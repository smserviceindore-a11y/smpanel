# Staging environment

Keep staging separate from production so demos and QA never touch live money or the live catalog.

## Stack

| Piece | Staging | Production |
|-------|---------|------------|
| MongoDB | Separate Atlas DB (e.g. `smglobal-staging`) | Live cluster / DB |
| API URL | Staging host or `localhost:5001` | Production API |
| Frontend | Staging host or `localhost:5173` | Production site |
| Razorpay | **Test** key id + secret | Live keys |
| `allowDemoPay` | `true` OK for internal demos | **Must be `false`** |
| Cloudinary | Optional separate cloud / folder prefix | Live |

## Setup

1. Copy `.env.example` → `.env.staging` (or a staging host env).
2. Point `MONGODB_URI` at the staging database.
3. Set Razorpay **test** keys in Super Admin → Settings (or env).
4. Keep `allowDemoPay: true` only while QA needs Demo Pay; turn it off before any external soft launch.
5. Seed with `npm run seed` / `npm run seed:money` against staging only.

## Policy

- Never reuse production JWT secrets or live Razorpay keys on staging.
- Never run seed scripts against production.
- CI (`test:api`) may skip when `MONGODB_URI` is unset — that is expected for PR smoke without secrets.

## Related

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
- [DISPUTE_PLAYBOOK.md](./DISPUTE_PLAYBOOK.md)
