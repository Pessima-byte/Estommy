"use client";

export function SkeletonTableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <tbody aria-busy="true" aria-label="Loading table data">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-200  rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200  rounded-lg h-32 w-full ${className}`} aria-busy="true" aria-label="Loading card" />
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="animate-pulse bg-gray-200  rounded-full"
      style={{ width: size, height: size }}
      aria-busy="true"
      aria-label="Loading avatar"
    />
  );
} 