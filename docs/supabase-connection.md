# Voyage Advent Supabase connection

Verified on 10 October 2026.

## Project

- Organisation: Voyage Advent
- Project reference: `krbqeahjljpmrlppzipb`
- Project URL: `https://krbqeahjljpmrlppzipb.supabase.co`
- Region: West EU (Ireland), `eu-west-1`
- Dashboard: https://supabase.com/dashboard/project/krbqeahjljpmrlppzipb

This is the dedicated Voyage Advent project. It is separate from the earlier project in the other connected organisation.

## Already applied

1. `initial_voyage_advent_schema`: the database setup, grants, row-level security, order functions and product-image bucket.
2. The catalogue seed: 28 products. Seed inserts do not overwrite existing product edits.
3. `consolidate_catalogue_read_policies`: one catalogue SELECT policy for each client role, with staff access to hidden products.

**Do not run `database/setup.sql` again on this project.** It is a fresh-project bootstrap, not an incremental upgrade script. The remote schema includes the catalogue-policy refinement also reflected in that file.

## Verified

- All five application tables have row-level security enabled.
- The public catalogue API returns 28 products using the publishable key.
- Anonymous API requests cannot read customer orders, staff membership, audit records or rate-limit records.
- Anonymous clients cannot call the privileged rate-limit function.
- The product-image bucket has a 5 MB file limit and accepts JPEG, PNG and WebP.
- The SQL regression checks cover staff-only hidden products, role isolation, order transitions, payment-reference requirements and stock reservation/release.
- Supabase Advisors found no security or performance warnings after the catalogue-policy refinement.

Two informational notices are expected for this new project: the private rate-limit table has no client RLS policies by design, and indexes have little or no usage before real orders exist. Do not add client access or remove these indexes just to clear those notices.

Advisor references: [RLS enabled with no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Vercel connection completed

All four settings are present in the **Production** environment of the existing `voyage-advent` project. The server key is stored as a sensitive secret; its value was not retrieved during this verification:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://krbqeahjljpmrlppzipb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Copy the active `sb_publishable_...` key from this project's API Keys settings |
| `SUPABASE_SECRET_KEY` | Copy the `sb_secret_...` key into Vercel as a secret |
| `NEXT_PUBLIC_SITE_URL` | `https://voyage-advent.vercel.app` |

Never commit the secret key or put it under a `NEXT_PUBLIC_` name. Use a separate database for previews when the store has real customer data. Redeploy after saving the variables.

The earlier Vercel scope-access issue is resolved. The production deployment was created after the secret was saved and is ready.

- Vercel project: `voyage-advent` (`prj_N1EznCHbUvAN598MhvS9hGSoi3ac`).
- Team: `elisha-oigaras-projects`.
- Website: https://voyage-advent.vercel.app
- Staff login: https://voyage-advent.vercel.app/admin
- Verified application commit: `408d9a1bb944340295c16f20efa6e660f7c5a154` on `main`.
- Verified deployment: `dpl_6A6DLUmb6DiYzJBwH8UM1pesRPrZ` (`voyage-advent-m9cndo1bk-elisha-oigaras-projects.vercel.app`).

### Checkout verification and cleanup — 10 October 2026

The earlier live checkout test reported a saved request, an identical retry without a duplicate, and a working confirmation screen. The resumed check independently inspected that same database record before removing it:

| Check | Evidence / result |
| --- | --- |
| Saved order | `VA-F587FBE2C3C4`, created at 09:04:54 UTC |
| Authoritative subtotal | Two Jameson Irish Whiskey 750 ml items at KSh 3,600 each: **KSh 7,200** |
| Retry | Earlier live test reported the same request was reused without a duplicate; one matching test order existed at cleanup |
| Safe test state | Clearly labelled system test; pending, unpaid, no payment reference, no reserved stock and no related audit entries |
| Cleanup | Deleted only the identified test row, guarded by its exact ID, request ID, reference and unpaid/unreserved state |
| Post-cleanup database | Zero matching test orders, zero matching audit records, zero total orders; all 28 products remain |
| Website | Primary website URL returned HTTP 200 without authentication; authenticated connector checks of `/checkout` and `/admin` returned HTTP 200 |
| Staff page | Displays the email/password login form |
| Production errors | Vercel reported no runtime errors in the preceding 24 hours |
| Security advisor | No WARN or ERROR findings; only the expected INFO notice for the private rate-limit table |

The retry and confirmation-screen results above were carried forward from the completed live test; no second order was created during cleanup. No payment was initiated and no WhatsApp message was sent. No secret was retrieved, database schema changed, catalogue changed or deployment-protection setting changed.

The admin workflow still needs an owner account and a real sign-in test. Product edits, image uploads and staff order transitions have not yet been tested through an authenticated production staff session.

## Create the staff login

There were no Auth users or staff accounts at verification time.

1. In Supabase, open **Authentication > Users**, and create an email/password user for the intended store administrator. Keep the password private.
2. Copy that user's UUID. In SQL Editor, run:

```sql
insert into public.voyage_admins (user_id)
values ('REPLACE_WITH_ADMIN_USER_UUID')
on conflict (user_id) do nothing;
```

3. Disable public sign-ups in Supabase Auth. Customers do not need an account for the current request checkout.
4. Set the Auth site URL to the deployed website URL, then test sign-in at `/admin`.
5. Sign in at `/admin`, then verify a product edit/image upload and the order lifecycle in the dashboard using a clearly labelled test request. Restore any edited catalogue data and remove the test request afterward.

There are still zero Auth users and zero staff memberships after cleanup. The owner must choose the login email and set the password privately in Supabase. Only the new user's UUID is needed for the membership SQL above. No staff password was generated and no invitation was sent.

## Remaining Daraja work

The site currently saves **order requests**; it does not collect payment or send live M-Pesa STK prompts. Adding Daraja variables alone will not enable payments.

1. Complete the client's Daraja production setup for the correct Paybill. Enter credentials directly into Vercel's server-only secrets.
2. Implement STK initiation using a saved, staff-confirmed order and the final server-calculated amount.
3. Persist payment attempts and provider request IDs, implement the HTTPS callback, and reconcile payment status, amount, merchant and order before marking an order paid.
4. Test failed/cancelled prompts, timeouts, retries, duplicate/delayed callbacks and amount mismatches.
5. Run a controlled merchant-approved live payment and verify receipt in the correct Paybill before launch.

See the README's order-handling and launch checks for final catalogue, delivery, contact and policy review. A custom domain remains optional and requires the owner's chosen domain.
