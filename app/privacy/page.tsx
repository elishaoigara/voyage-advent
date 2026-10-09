import { shop } from "@/lib/config";
export const metadata = { title: "Privacy notice" };
export default function Privacy() {
  return (
    <article className="prose-page">
      <p className="eyebrow">YOUR DETAILS, WITH CARE</p>
      <h1>Privacy notice.</h1>
      <p>
        This notice explains how information provided through the Voyage Advent
        website is used for order requests and customer support.
      </p>
      <h2>Information you provide</h2>
      <p>
        Checkout asks for your name, mobile number, delivery or collection
        preference, delivery address where needed, and confirmation that you are
        18 or older. Email and order notes are optional. Your request also
        includes the products and quantities you select.
      </p>
      <h2>How we use it</h2>
      <p>
        We use these details to respond to your request, confirm stock and
        delivery, arrange payment and fulfilment, and resolve order queries.
        Technical request information may be used to prevent repeated or abusive
        submissions.
      </p>
      <h2>Services involved</h2>
      <p>
        The website is designed to run on Vercel, with Supabase used for stored
        order records and authorised staff access. If you choose to continue on
        WhatsApp, the order details in the prepared message are shared with
        WhatsApp when you open or send that message. WhatsApp’s own privacy
        terms also apply.
      </p>
      <h2>Information on your device</h2>
      <p>
        Your bag is saved in your browser so it remains available when you
        return. Age confirmation is remembered for your browsing session. Staff
        sign-in uses authentication cookies. This site does not request or store
        your M-Pesa PIN.
      </p>
      <h2>Questions and requests</h2>
      <p>
        For questions about your information, or to request access, correction
        or deletion of your order details, email{" "}
        <a href={`mailto:${shop.email}`}>{shop.email}</a>. We may need to verify
        your identity before responding.
      </p>
    </article>
  );
}
