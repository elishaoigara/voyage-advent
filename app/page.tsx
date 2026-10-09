import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  PackageCheck,
  MessageCircle,
  Wine,
  Gift,
  GlassWater,
  Beer,
} from "lucide-react";
import { getProducts } from "@/lib/catalogue";
import { ProductCard } from "@/components/product-card";
import { whatsappUrl } from "@/lib/config";
export const dynamic = "force-dynamic";
export default async function Home() {
  const products = await getProducts();
  const featured = products
    .filter((p) => p.featured)
    .sort(
      (a, b) =>
        Number(b.collection === "discovery") -
        Number(a.collection === "discovery"),
    )
    .slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="little-line" /> FOR THE CURIOUS PALATE
          </div>
          <h1>
            A world of taste.
            <br />
            <em>A little closer.</em>
          </h1>
          <p>
            From the bottles you know to the ones worth discovering. Explore a
            considered collection of spirits, wines and beers.
          </p>
          <div className="hero-actions">
            <Link className="button gold" href="/shop">
              Explore the collection <ArrowUpRight size={19} />
            </Link>
            <Link className="hero-secondary" href="/shop?collection=discovery">
              Discover Voyage selects <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-footnote">
            <Compass size={26} strokeWidth={1} />
            <span>
              FAMILIAR FAVOURITES.
              <br />
              <strong>UNEXPECTED DISCOVERIES.</strong>
            </span>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="/images/hero-whisky.jpg"
            alt="Amber whisky and a glass over ice in warm evening light"
            fetchPriority="high"
          />
          <div className="hero-image-shade" />
          <span className="image-index">THE ART OF A GOOD POUR</span>
          <div className="hero-image-caption">
            <span>THE VOYAGE COLLECTION</span>
            <p>
              For moments
              <br />
              worth slowing down.
            </p>
          </div>
          <span className="hero-image-number">01 / THE EDIT</span>
        </div>
        <div className="hero-vertical">SPIRITS · WINES · BEERS · DISCOVERY</div>
      </section>
      <div className="service-strip">
        <div>
          <Compass />
          <span>Thoughtfully selected</span>
        </div>
        <div>
          <Wine />
          <span>Everyday to exceptional</span>
        </div>
        <div>
          <PackageCheck />
          <span>Delivery & collection</span>
        </div>
        <div>
          <MessageCircle />
          <span>A real person, a message away</span>
        </div>
      </div>
      <section className="section categories-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FOLLOW YOUR TASTE</p>
            <h2>Where shall we begin?</h2>
          </div>
          <Link className="text-link" href="/shop">
            Shop all bottles <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="category-grid">
          {[
            {
              name: "Whisky",
              desc: "Depth. Character. Discovery.",
              img: "johnnie-walker-black-label.jpg",
              count: "01",
              cat: "Whisky",
            },
            {
              name: "Gin & vodka",
              desc: "A fresh take on your usual.",
              img: "hendrick-s-gin.jpg",
              count: "02",
              cat: "Gin,Vodka",
            },
            {
              name: "Wine",
              desc: "A bottle for the table.",
              img: "4th-street-sweet-red.jpg",
              count: "03",
              cat: "Wine",
            },
            {
              name: "Beer & cider",
              desc: "Your familiar favourites.",
              img: "tusker-lager.jpg",
              count: "04",
              cat: "Beer,Cider",
            },
          ].map((c) => (
            <Link
              className="category-card"
              href={`/shop?category=${encodeURIComponent(c.cat)}`}
              key={c.name}
            >
              <span className="category-number">{c.count} / EXPLORE</span>
              <img src={`/images/${c.img}`} alt="" loading="lazy" />
              <div>
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
              </div>
              <ArrowUpRight className="category-arrow" size={21} />
            </Link>
          ))}
        </div>
      </section>
      <section className="section featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A GOOD PLACE TO START</p>
            <h2>The considered collection.</h2>
          </div>
          <p className="heading-aside">
            A few familiar names.
            <br />A few new favourites to find.
          </p>
        </div>
        <div className="product-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="section-centre">
          <Link className="button outline-dark" href="/shop">
            Find your next favourite <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="editorial">
        <div className="editorial-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <img
            src="/images/logo.png"
            alt="Voyage Advent compass and bottle emblem"
            loading="lazy"
          />
          <span>THE SPIRIT OF DISCOVERY</span>
        </div>
        <div className="editorial-copy" id="story">
          <p className="eyebrow">MORE THAN A BOTTLE</p>
          <h2>
            Not a liquor store.
            <br />
            <em>A launchpad.</em>
          </h2>
          <p>
            Some bottles take you somewhere new. Others bring you back to a
            place you know.
          </p>
          <p>
            Voyage Advent brings both together: a neighbourhood drinks shop with
            everyday favourites and a carefully chosen premium shelf. No maps
            required. Just a little curiosity.
          </p>
          <Link
            className="text-link gold-text"
            href="/shop?collection=discovery"
          >
            Meet the Voyage selects <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
      <section className="section occasion-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE IT YOUR MOMENT</p>
            <h2>A different kind of occasion.</h2>
          </div>
        </div>
        <div className="occasion-grid">
          {[
            {
              name: "The slow evening",
              desc: "Settle in. Savour something.",
              value: "Slow Evening",
              icon: GlassWater,
            },
            {
              name: "Around the table",
              desc: "Good company, a thoughtful bottle.",
              value: "Celebration",
              icon: Wine,
            },
            {
              name: "A little thank you",
              desc: "Find a gift with character.",
              value: "Gifting",
              icon: Gift,
            },
            {
              name: "The weekend edit",
              desc: "Keep your favourites close.",
              value: "Weekend",
              icon: Beer,
            },
          ].map(({ name, desc, value, icon: Icon }, i) => (
            <Link
              key={name}
              className="occasion-card"
              href={`/shop?occasion=${encodeURIComponent(value)}`}
            >
              <div>
                <Icon size={29} strokeWidth={1} />
                <span>0{i + 1}</span>
              </div>
              <h3>{name}</h3>
              <p>{desc}</p>
              <ArrowUpRight className="occasion-arrow" size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="concierge">
        <div>
          <p className="eyebrow">YOUR NEXT BOTTLE, SORTED</p>
          <h2>Good taste starts with a conversation.</h2>
          <p>
            Looking for a gift, a familiar favourite or something new? Let’s
            find it together.
          </p>
        </div>
        <a
          className="button dark"
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} /> Talk to the team{" "}
          <ArrowUpRight size={17} />
        </a>
      </section>
    </>
  );
}
