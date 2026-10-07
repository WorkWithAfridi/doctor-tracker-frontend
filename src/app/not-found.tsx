import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <span className="eyebrow">404 · PAGE NOT FOUND</span>
      <h1>This page took a different path.</h1>
      <p>Let&apos;s get you back to your care workspace.</p>
      <Link href="/dashboard" className="button primary">
        Back to overview
      </Link>
    </main>
  );
}
