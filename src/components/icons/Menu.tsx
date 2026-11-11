/** Hamburger: three 1.5px bars, 26 x 16 (iPhone design). */
export default function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 26 16"
      width="26"
      height="16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="26" height="1.5" fill="currentColor" />
      <rect x="0" y="7.25" width="26" height="1.5" fill="currentColor" />
      <rect x="0" y="14.5" width="26" height="1.5" fill="currentColor" />
    </svg>
  );
}
