"use client";
export function RequestState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  if (loading)
    return (
      <div className="empty-state" role="status">
        Loading your workspace data…
      </div>
    );
  return (
    <div className="empty-state" role="alert">
      <h3>Unable to load data</h3>
      <p>{error}</p>
      <button className="button secondary" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
