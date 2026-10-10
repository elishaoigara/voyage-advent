import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("Supabase SQL: role isolation, order lifecycle and atomic stock reservations", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public,storage to anon,authenticated,service_role;
 grant execute on function auth.uid() to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;grant select,insert on storage.objects to anon,authenticated;
 `);
    await db.exec(
      await readFile(new URL("../database/setup.sql", import.meta.url), "utf8"),
    );
    await db.exec(
      await readFile(new URL("../database/seed.sql", import.meta.url), "utf8"),
    );
    const admin = "11111111-1111-4111-8111-111111111111";
    const other = "22222222-2222-4222-8222-222222222222";
    await db.query("insert into auth.users values ($1),($2)", [admin, other]);
    await db.query("insert into public.voyage_admins(user_id) values ($1)", [
      admin,
    ]);
    const order = "33333333-3333-4333-8333-333333333333";
    const product = "kenya-cane";
    await db.query(`update public.voyage_products set stock=2 where id=$1`, [
      product,
    ]);
    await db.query(
      `insert into public.voyage_orders(id,request_id,request_hash,reference,customer_name,phone,fulfilment,address,age_confirmed,items,subtotal) values($1,$1,'test','VA-TEST','Customer','254712345678','delivery','Nairobi',true,$2,1300)`,
      [
        order,
        JSON.stringify([
          {
            id: product,
            name: "Kenya Cane",
            size: "750ml",
            price: 650,
            quantity: 2,
          },
        ]),
      ],
    );
    await t.test(
      "anonymous users see active products but cannot access customer orders or privileged functions",
      async () => {
        await db.exec("set role anon");
        const p = await db.query("select id from public.voyage_products");
        assert.equal(p.rows.length, 28);
        await assert.rejects(
          db.query("select * from public.voyage_orders"),
          /permission denied/,
        );
        await assert.rejects(
          db.query(`select public.voyage_check_rate('x',5)`),
          /permission denied/,
        );
        await db.exec("reset role");
      },
    );
    await t.test(
      "non-staff accounts cannot read orders, grant themselves access, or edit products",
      async () => {
        await db.exec("set role authenticated");
        await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
          other,
        ]);
        const orders = await db.query("select * from public.voyage_orders");
        assert.equal(orders.rows.length, 0);
        await assert.rejects(
          db.query("insert into public.voyage_admins(user_id) values($1)", [
            other,
          ]),
          /permission denied/,
        );
        const changed = await db.query(
          `update public.voyage_products set price=1 where id=$1 returning id`,
          [product],
        );
        assert.equal(changed.rows.length, 0);
        await db.exec("reset role");
      },
    );
    await t.test(
      "staff can read orders and edit products but cannot bypass order lifecycle with direct updates",
      async () => {
        await db.exec("set role authenticated");
        await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
          admin,
        ]);
        assert.equal(
          (await db.query("select * from public.voyage_orders")).rows.length,
          1,
        );
        await assert.rejects(
          db.query(`update public.voyage_orders set status='completed'`),
          /permission denied/,
        );
        await db.exec("reset role");
      },
    );
    await t.test("only staff can read inactive products", async () => {
      await db.query(
        "update public.voyage_products set active=false where id=$1",
        [product],
      );
      await db.exec("set role anon");
      assert.equal(
        (
          await db.query("select id from public.voyage_products where id=$1", [
            product,
          ])
        ).rows.length,
        0,
      );
      await db.exec("reset role; set role authenticated");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        other,
      ]);
      assert.equal(
        (
          await db.query("select id from public.voyage_products where id=$1", [
            product,
          ])
        ).rows.length,
        0,
      );
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        admin,
      ]);
      assert.equal(
        (
          await db.query("select id from public.voyage_products where id=$1", [
            product,
          ])
        ).rows.length,
        1,
      );
      await db.exec("reset role");
      await db.query(
        "update public.voyage_products set active=true where id=$1",
        [product],
      );
    });
    async function update(
      status: string,
      fee: number | null = 150,
      payment = "unpaid",
      ref = "",
    ) {
      return db.query(
        "select public.voyage_update_order($1,$2,$3,$4,$5,$6,$7)",
        [order, admin, status, fee, payment, ref, "test"],
      );
    }
    await t.test(
      "confirmation requires a delivery quote and reserves stock once",
      async () => {
        await db.exec("set role service_role");
        await assert.rejects(update("confirmed", null), /delivery fee/);
        assert.equal(
          (
            await db.query<{ stock: number }>(
              "select stock from public.voyage_products where id=$1",
              [product],
            )
          ).rows[0].stock,
          2,
        );
        await update("confirmed");
        await update("confirmed");
        assert.equal(
          (
            await db.query<{ stock: number }>(
              "select stock from public.voyage_products where id=$1",
              [product],
            )
          ).rows[0].stock,
          0,
        );
      },
    );
    await t.test(
      "invalid transitions and paid-without-reference fail without changing the order",
      async () => {
        await assert.rejects(update("completed"), /transition/);
        await assert.rejects(update("preparing", 150, "paid", ""), /reference/);
        assert.equal(
          (
            await db.query<{ status: string }>(
              "select status from public.voyage_orders where id=$1",
              [order],
            )
          ).rows[0].status,
          "confirmed",
        );
      },
    );
    await t.test(
      "cancellation releases inventory exactly once and records an audit trail",
      async () => {
        await update("cancelled");
        await update("cancelled");
        assert.equal(
          (
            await db.query<{ stock: number }>(
              "select stock from public.voyage_products where id=$1",
              [product],
            )
          ).rows[0].stock,
          2,
        );
        assert(
          (await db.query("select * from public.voyage_audit")).rows.length >=
            3,
        );
        await assert.rejects(update("confirmed"), /transition/);
      },
    );
    await t.test(
      "rate limiter enforces its configured request budget",
      async () => {
        for (let i = 0; i < 5; i++)
          assert.equal(
            (
              await db.query<{ ok: boolean }>(
                `select public.voyage_check_rate('phone-test',5) as ok`,
              )
            ).rows[0].ok,
            true,
          );
        assert.equal(
          (
            await db.query<{ ok: boolean }>(
              `select public.voyage_check_rate('phone-test',5) as ok`,
            )
          ).rows[0].ok,
          false,
        );
      },
    );
  } finally {
    await db.close();
  }
});
