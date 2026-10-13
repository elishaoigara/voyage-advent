# NCBA payment integration — Voyage Advent

Status: **integration plan only; live payments disabled**. This guide is based on the merchant's supplied *NCBA Till STK Push & Dynamic QR Code API (2024)* and *NCBA Paybill-Level Push Notifications Service Guide (2023)*. Bank-provided examples are not production credentials.

## Important: service selection
The documents describe **NCBA's own APIs**, not Safaricom Daraja. Do not enable both integrations for the same payment without a separately agreed design. Confirm with NCBA whether Voyage uses its **Till under Paybill 880100** or an independently issued dedicated Paybill/Buygoods merchant number, and confirm the merchant identifier, account reference format, and production onboarding before writing transaction logic.

### Bank interfaces (confirmed by supplied documents)

| Purpose | Method / path | Notes |
|---|---|---|
| Auth | `GET https://c2bapis.ncbagroup.com/payments/api/v1/auth/token` | STK section p.3: Basic Auth, returns Bearer token, nominal `expires_in: 18000` |
| Initiate STK | `POST /payments/api/v1/stk-push/initiate` | Bearer token; body: `TelephoneNo`, `Amount`, `PayBillNo`, `AccountNo`, `Network`, `TransactionType` |
| STK query | `POST /payments/api/v1/stk-push/query` | Bearer token; body: `TransactionID`; response `status` and `description` |
| Generate QR | `POST /payments/api/v1/qr/generate` | Bearer token; body `till` plus optional numeric `amount`, returns `Base64QrCode` |
| Receive notifications | Client-hosted HTTPS POST endpoint | NCBA sends JSON or XML notifications; configure one agreed format |

**Documentation inconsistencies to resolve with NCBA before activation:**
1. Token endpoint is `GET` in STK section (p.3) but `POST` in QR section (p.6). Confirm supported method(s).
2. Notification guide (p.5–6) says SHA-256 followed by Base64 of the **hex string**, not Base64 of raw hash bytes. Verify with bank-supplied known-answer test vectors, including the NCBA Till variant and its `FTRef`, `Narrative` fields.
3. Clarify exact `PayBillNo` and `AccountNo` values for the merchant's **NCBA Till alias under 880100**, and whether `TransactionType=CustomerPayBillOnline` applies.
4. Determine whether the query's `SUCCESS` is sufficient for final settlement or must be reconciled with a signed payment notification / bank statement. **Do not mark an order paid from an initiation success response**.
5. Confirm callback IP/network requirements, TLS version, retries, response deadlines, production vs sandbox hosts, and merchant-side go-live approval.

## Implement behind an explicit, default-off flag

1. `NCBA_PAYMENTS_ENABLED=false` initially. Store **server-only** NCBA credentials in Vercel secrets, not Git or `NEXT_PUBLIC_*`.
2. Create an **additive, independently reviewed** Supabase migration for `voyage_payment_attempts` (attempt UUID, order UUID, provider, merchant reference, expected amount, attempt state, NCBA `TransactionID` and `ReferenceID`, timestamps, unique constraints) and `voyage_payment_events` (deduplication by `TransID` scoped to merchant, payload digest, validation outcome). Apply RLS: no public reads, authenticated staff read only, trusted server-only writes.
3. Create admin-authorized initiation for **confirmed** orders only. Validate phone and final server-calculated amount (`subtotal + delivery_fee`), verified merchant, and enforce single active attempt per order plus per-customer rate limits. Never accept a client-supplied payment amount or account number.
4. Server gets/caches Bearer token, initiates STK, stores references atomically; a successful initiation merely sets `pending`. Timeouts leave an ambiguous state requiring query or reconciliation, **not blind re-initiation**.
5. Build `POST /api/payments/ncba/notify` with a strict size/content-type limit, independently verified username/password/hash, constant-time credential comparisons, replay protection, optional bank-approved IP restrictions, and an idempotent DB transaction. Return the JSON `ResultCode` / `ResultDesc` shape shown in the bank guide (p.11) only after durable processing. Do **not** apply `assertOrigin` to server-to-server calls; origin headers are not callback authentication.
6. Match exact merchant/Till and order reference, currency, amount, provider reference, and transaction state; unmatched or mismatched transactions enter manual reconciliation and cannot mark an order paid. Record raw data securely with retention limits and redact customer PII/secrets from logs. NCBA Till notifications use `BusinessShortCode=880100`, `BillRefNumber` as merchant Till alias, and optionally `Narrative` for order reference (guide p.11); **confirm actual merchant mapping with NCBA**.
7. Query uncertain STK attempts, reconcile duplicate/delayed notifications and out-of-order results, and require trusted server-side confirmation for the paid state. Existing `voyage_update_order` permits staff-manual `paid` changes: preserve manual verification for current offline payments but distinguish `manual_verified` from `ncba_confirmed` in audit and reconciliation before automatic activation.
8. Optionally generate a dynamic QR for the final amount, with order reference narration **only after bank confirms allowed characters/length**; do not treat generation or scan as payment.
9. Customer UI: show payment choice only after confirmation of delivery/stock; distinguish requested / prompt sent / pending / paid / failed / manual review. Do not promise instant success.

## Required merchant configuration (never paste secrets into chat)
- Bank-confirmed merchant NCBA Till / Paybill and settlement bank account; written instruction submitted to NCBA
- NCBA production API username/password and payment notification username/password/secret key (may be separate credentials; confirm with bank)
- Notification URL registered/activated by the bank: `https://voyage-advent.vercel.app/api/payments/ncba/notify` **after the endpoint is deployed and secured**
- NCBA sandbox/staging credentials and test cases; bank confirmation of transaction reference conventions

Suggested future server-only environment names, pending bank confirmation: `NCBA_PAYMENTS_ENABLED`, `NCBA_API_BASE_URL`, `NCBA_API_USERNAME`, `NCBA_API_PASSWORD`, `NCBA_MERCHANT_TILL`, `NCBA_PAYBILL`, `NCBA_NOTIFICATION_USERNAME`, `NCBA_NOTIFICATION_PASSWORD`, `NCBA_NOTIFICATION_SECRET`.

## Acceptance before production activation
- Admin account created, `/admin` sign-in and authenticated operations tested
- STK authorized / declined / timed out / network failure / retry / duplicate click
- Signature/hash tamper, incorrect merchant or amount, replay, duplicates, unsolicited deposits, matching and unmatched references
- Correct handling of `FAILED` and late-success notifications without double fulfillment
- Controlled low-value live transaction approved by merchant; verify the corresponding credit at NCBA
- Reconciliation dashboard and emergency disable switch
- Ensure the bank callback can reach the production URL and receives the expected response

## Existing state at 13 October 2026
The repository currently supports **order requests only**; recorded production checkout verification and test-order cleanup are in `docs/supabase-connection.md`. The admin route exists at `/admin`, but the owner account and sign-in test were outstanding in the last documented check. There is no NCBA implementation, migration or live callback in this planning branch. Do not run the one-time `database/setup.sql` again against the live project.
