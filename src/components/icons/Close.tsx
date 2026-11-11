/** Close: 1.5px X spanning 19.5 x 19.5 (iPhone design). */
export default function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 19.5 19.5"
      width="19.5"
      height="19.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0.53 0.53L18.97 18.97"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M18.97 0.53L0.53 18.97"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
