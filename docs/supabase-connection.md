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

## Finish the Vercel connection

Add these to the **Production** environment of the existing `voyage-advent` project:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://krbqeahjljpmrlppzipb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Copy the active `sb_publishable_...` key from this project's API Keys settings |
| `SUPABASE_SECRET_KEY` | Copy the `sb_secret_...` key into Vercel as a secret |
| `NEXT_PUBLIC_SITE_URL` | The website's actual HTTPS deployment domain |

Never commit the secret key or put it under a `NEXT_PUBLIC_` name. Use a separate database for previews when the store has real customer data. Redeploy after saving the variables.

The Vercel connection could list the project but returned a scope access error when reading its settings, so environment variables and runtime database connectivity have not been verified. Database setup alone does not prove that the deployed website is connected.

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
5. After the environment variables are active, verify a product edit/image upload and a customer request in the dashboard. Payment collection remains disabled until the separate Daraja integration.

No staff password was generated, no invitation was sent, and no customer order was created during database verification.
