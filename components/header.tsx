"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Search, Menu, X, ArrowUpRight } from "lucide-react";
import { useBag } from "./providers";
import { whatsappUrl } from "@/lib/config";
export function Header() {
  const { count, setOpen } = useBag();
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  return (
    <>
      <div className="announcement">
        <span>A little discovery. A great bottle.</span>
        <a href={whatsappUrl()} target="_blank" rel="noreferrer">
          Let’s find your next favourite <ArrowUpRight size={12} />
        </a>
        <span className="adult-note">18+ · Enjoy responsibly</span>
      </div>
      <header className="header">
        <div className="header-inner">
          <Link
            className="brand"
            href="/"
            onClick={() => setMenu(false)}
            aria-label="Voyage Advent home"
          >
            <img src="/images/logo.png" width="50" height="50" alt="" />
            <span>
              VOYAGE<small>A D V E N T</small>
            </span>
          </Link>
          <nav
            className={menu ? "navigation expanded" : "navigation"}
            aria-label="Main navigation"
          >
            {[
              ["/", "Home"],
              ["/shop", "The collection"],
              ["/shop?collection=discovery", "Voyage selects"],
              ["/#story", "Our story"],
            ].map(([href, label]) => (
              <Link
                key={href}
                className={path === href ? "active" : ""}
                href={href}
                onClick={() => setMenu(false)}
              >
                {label}
              </Link>
            ))}
            <a
              className="nav-contact"
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Get in touch <ArrowUpRight size={14} />
            </a>
          </nav>
          <div className="header-actions">
            <Link
              className="icon-button desktop-search"
              href="/shop?focus=search"
              aria-label="Search the collection"
            >
              <Search size={20} />
            </Link>
            <button
              className="bag-button"
              onClick={() => setOpen(true)}
              aria-label={`Open shopping bag, ${count} items`}
            >
              <ShoppingBag size={20} />
              <span className="bag-label">Bag</span>
              <b>{count}</b>
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
