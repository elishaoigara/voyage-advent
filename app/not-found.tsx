import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <p className="eyebrow">A SMALL DETOUR</p>
      <h1 style={{ fontSize: 50 }}>This way to discovery.</h1>
      <p>
        We couldn’t find that page or bottle. There’s still plenty to explore.
      </p>
      <Link className="button dark" href="/shop">
        Back to the collection
      </Link>
    </div>
  );
}
