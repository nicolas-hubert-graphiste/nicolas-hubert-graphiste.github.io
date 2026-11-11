export default function MenuIcon({
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
      <rect x="1" y="3" width="22" height="1.5" fill="currentColor" />
      <rect x="1" y="10" width="22" height="1.5" fill="currentColor" />
      <rect x="1" y="17" width="22" height="1.5" fill="currentColor" />
    </svg>
  );
}
