'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container section narrow-page">
      <p className="eyebrow">Error</p>
      <h1>Something went wrong.</h1>
      <div className="card info-card">
        <p>The application encountered an unexpected issue while loading this page.</p>
        <button className="button primary" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
