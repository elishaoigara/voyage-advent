import Link from "next/link";
import { whatsappUrl } from "@/lib/config";
export const metadata = { title: "Delivery & collection" };
export default function Delivery() {
  return (
    <article className="prose-page">
      <p className="eyebrow">FROM OUR SHELF TO YOUR TABLE</p>
      <h1>Delivery & collection.</h1>
      <h2>Tell us where you are.</h2>
      <p>
        Choose delivery at checkout and share your area, address and a useful
        landmark. Our team will confirm whether we can deliver, the delivery
        charge and an estimated arrival time before you pay.
      </p>
      <p>
        Delivery is quoted separately from the items in your bag. Submitting a
        request does not confirm delivery or reserve stock.
      </p>
      <h2>Prefer to collect?</h2>
      <p>
        Select collection at checkout. We’ll confirm your items, the collection
        location and a suitable time. Please wait for confirmation before
        travelling.
      </p>
      <h2>A change of plans?</h2>
      <p>
        Contact us as soon as possible if you need to change an address, amend a
        request or cancel. We’ll confirm what’s possible for your order before
        proceeding.
      </p>
      <h2>Adults only.</h2>
      <p>
        Alcohol orders are for people aged 18 or over. The purchaser and
        recipient must be adults. Our team will explain any identification
        checks when confirming your order.
      </p>
      <a
        className="button dark"
        href={whatsappUrl(
          "Hello Voyage Advent, I would like to check delivery availability.",
        )}
        target="_blank"
        rel="noreferrer"
      >
        Check delivery with us ↗
      </a>
      <p style={{ marginTop: 25 }}>
        <Link href="/shop">Back to the collection</Link>
      </p>
    </article>
  );
}
