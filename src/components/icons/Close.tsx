export default function CloseIcon({
  className = "size-[24px] text-black",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M2 2L22 22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 2L2 22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
