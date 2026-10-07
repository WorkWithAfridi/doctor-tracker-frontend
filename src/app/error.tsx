"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="not-found">
      <h1>Something went wrong.</h1>
      <p>Your browser demo data is saved. Try opening the page again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
