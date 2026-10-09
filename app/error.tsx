"use client";
import { whatsappUrl } from "@/lib/config";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1 style={{ fontSize: 45 }}>A brief detour.</h1>
      <p>
        We couldn’t load this page. Please try again, or contact our team for
        help with an order.
      </p>
      <button className="button dark" onClick={reset}>
        Try again
      </button>
      <a className="text-link" style={{ marginTop: 20 }} href={whatsappUrl()}>
        Contact Voyage Advent
      </a>
    </div>
  );
}
