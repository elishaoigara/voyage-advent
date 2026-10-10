import Link from "next/link";
import { ArrowUpRight, Instagram, Mail } from "lucide-react";
import { shop, whatsappUrl } from "@/lib/config";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="brand" href="/">
            <img src="/images/logo.png" width="58" height="58" alt="" />
            <span>
              VOYAGE<small>A D V E N T</small>
            </span>
          </Link>
          <p>
            Good bottles. Better discoveries.
            <br />
            Your next voyage starts here.
          </p>
          <div className="social-links">
            <a
              href={shop.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a href={`mailto:${shop.email}`} aria-label="Email Voyage Advent">
              <Mail size={18} />
            </a>
          </div>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <Link href="/shop">The collection</Link>
          <Link href="/shop?collection=discovery">Voyage selects</Link>
          <Link href="/shop?collection=favourites">Everyday favourites</Link>
          <Link href="/#story">Our story</Link>
        </div>
        <div>
          <h4>HERE TO HELP</h4>
          <Link href="/delivery">Delivery & collection</Link>
          <Link href="/help">Ordering & payment</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <div className="footer-contact">
          <h4>LET’S TALK TASTE</h4>
          <a className="footer-phone" href={`tel:${shop.whatsapp}`}>
            {shop.phone}
          </a>
          <a href={`mailto:${shop.email}`}>{shop.email}</a>
          <a
            className="footer-whatsapp"
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Voyage Advent</span>
        <span>18+ only. Enjoy thoughtfully. Drink responsibly.</span>
        <span>SPIRITS · WINES · BEERS</span>
      </div>
    </footer>
  );
}
