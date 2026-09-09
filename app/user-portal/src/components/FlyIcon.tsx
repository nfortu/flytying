/** Minimalist silhouette of a classic dry fly (upright divided wings, tapered body, tail fibers). */
export function FlyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 10 L23 10 C28.5 10 30 14.5 27.2 17.8 C25.5 19.8 22.5 19.2 22 16.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M26.5 12.5 C30 11 33 10.3 35 10.5 M26.8 14.5 C30.3 14.3 33.3 14.5 35 15 M26.5 16.5 C29.7 17.8 32.5 19 34.5 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path d="M6 10 C9 6.3 19 6.3 22.5 10 C19 13 9 13 6 10 Z" fill="currentColor" />
      <path
        d="M10.5 8 C8.5 5.8 7.3 2.8 7.5 0.8 C10 1.8 12 4.5 12.3 7.6 C11.6 7.9 11 8 10.5 8 Z"
        fill="currentColor"
      />
      <path
        d="M12 7.8 C12.7 4.6 14.6 1.9 16.7 1 C16.5 3.9 15.2 6.5 13.4 8.1 C12.9 8 12.4 7.9 12 7.8 Z"
        fill="currentColor"
      />
    </svg>
  );
}
