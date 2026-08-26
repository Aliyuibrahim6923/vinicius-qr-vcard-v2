"use client";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="center-page"><h1>Something went wrong</h1><p>Please try again in a moment.</p><button className="button" onClick={reset}>Try again</button></main>;
}
