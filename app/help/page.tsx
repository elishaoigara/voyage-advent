import { whatsappUrl, shop } from "@/lib/config";
export const metadata = { title: "Ordering & payment" };
export default function Help() {
  return (
    <article className="prose-page">
      <p className="eyebrow">A LITTLE GUIDANCE</p>
      <h1>Good questions. Clear answers.</h1>
      {[
        [
          "How do I place an order?",
          "Add your bottles to the bag, open checkout and enter your contact and delivery or collection details. Request confirmation, then follow up on WhatsApp if you wish. Our team confirms stock and the final amount before payment.",
        ],
        [
          "Is my order confirmed when I submit it?",
          "No. Checkout sends an order request. Your order is confirmed when our team accepts it and agrees the delivery or collection details with you.",
        ],
        [
          "How do I pay?",
          "Our team will provide payment instructions after confirming your order. Automatic M-Pesa phone prompts are not available yet. Never enter your M-Pesa PIN on this website or share it with anyone.",
        ],
        [
          "Are delivery charges included?",
          "Product prices are shown in Kenyan shillings. Delivery charges are quoted separately based on your location. The final amount is confirmed before payment.",
        ],
        [
          "What if a bottle is unavailable?",
          "We’ll let you know before confirming your order. Any substitution or price change needs your agreement.",
        ],
        [
          "Can I change, cancel or return an order?",
          "Contact our team promptly with your order reference. We’ll review the order status and explain the applicable cancellation, return or refund arrangements. Please ask for these details before paying if you are unsure.",
        ],
        [
          "What if my order arrives damaged or incorrect?",
          "Contact us promptly with your order reference and details of the issue. If possible, keep the packaging and take photos to help us investigate.",
        ],
        [
          "Can I order a gift?",
          "Yes, you can tell us it is a gift in the checkout notes. Ask our team about presentation and delivery arrangements. The recipient must be 18 or over.",
        ],
      ].map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <h2>A real person, a message away.</h2>
      <p>
        <a href={whatsappUrl()} target="_blank" rel="noreferrer">
          Chat on WhatsApp
        </a>{" "}
        or email <a href={`mailto:${shop.email}`}>{shop.email}</a>.
      </p>
    </article>
  );
}
