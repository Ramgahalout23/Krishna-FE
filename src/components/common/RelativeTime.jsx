import { useEffect, useState } from 'react';

/**
 * Format a past timestamp relative to `now` (both in ms).
 */
function formatRelative(past, now) {
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(past).toLocaleDateString();
}

/**
 * Renders "Updated 2m ago" and keeps itself fresh on its own timer.
 *
 * Deliberately a leaf component: the tick re-renders only this span, not the
 * chart-heavy page around it, and Date.now() is never called during the
 * parent's render (which breaks memoization and the React Compiler).
 */
export default function RelativeTime({
  date,
  prefix = '',
  className,
  title,
  intervalMs = 30000,
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!date) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [date, intervalMs]);

  if (!date) return null;

  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;

  return (
    <span className={className} title={title || `Last updated: ${value.toLocaleString()}`}>
      {prefix}{formatRelative(value.getTime(), now)}
    </span>
  );
}
