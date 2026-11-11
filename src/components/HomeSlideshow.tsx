import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Slide = {
  image: string;
  width?: number;
  height?: number;
  href: string;
  title: string;
  navColor: "black" | "white";
};

type Props = {
  slides: Slide[];
  labels: { prev: string; next: string };
  intervalMs?: number;
};

const ARROW = (
  <svg
    viewBox="0 0 100 100"
    className="size-10 fill-current"
    aria-hidden="true"
  >
    <polygon points="44.21 89.03 48.82 93.65 92.8 49.82 48.82 6 44.21 10.61 80.19 46.44 7 46.44 7 53.21 80.19 53.21" />
  </svg>
);

/**
 * Server-renders a vertical stack (phones) and a single-slide stage (desktop).
 * Once hydrated at `lg` it becomes an autoplaying slideshow with arrows and
 * keyboard control, and flips the page chrome colour per slide.
 */
export default function HomeSlideshow({
  slides,
  labels,
  intervalMs = 5000,
}: Props) {
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (delta: number) => setIndex((current) => (current + delta + count) % count),
    [count]
  );

  useEffect(() => setHydrated(true), []);

  // Autoplay unless the visitor prefers reduced motion.
  useEffect(() => {
    if (!hydrated || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => go(1), intervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [hydrated, count, go, intervalMs, index]);

  useEffect(() => {
    if (!hydrated) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hydrated, go]);

  // Fetch the next slide's image ahead of time so it is ready when we advance.
  useEffect(() => {
    if (!hydrated || count < 2) return;
    const next = slides[(index + 1) % count];
    if (next) new Image().src = next.image;
  }, [hydrated, index, count, slides]);

  // Chrome colour follows the current slide (body[data-theme] drives the nav).
  useEffect(() => {
    if (!hydrated) return;
    const slide = slides[index];
    if (!slide) return;
    document.body.dataset.theme = slide.navColor === "black" ? "light" : "dark";
    return () => {
      document.body.dataset.theme = "dark";
    };
  }, [hydrated, index, slides]);

  if (count === 0) return null;

  return (
    <>
      {/* Phones and tablets: vertical stack, black background. */}
      <div className="flex flex-col gap-8 px-2 pt-16 pb-10 lg:hidden">
        {slides.map((slide, i) => (
          <a key={slide.href + i} href={slide.href} className="block">
            <img
              src={slide.image}
              alt={slide.title}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              width={slide.width}
              height={slide.height}
              decoding="async"
              className="w-full bg-placeholder"
            />
          </a>
        ))}
      </div>

      {/* Desktop: full-viewport stage. */}
      <div className="relative hidden h-dvh w-full overflow-hidden lg:block">
        {slides.map((slide, i) => (
          <a
            key={slide.href + i}
            href={slide.href}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
          >
            <img
              src={slide.image}
              alt={slide.title}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              decoding="async"
              className="size-full bg-placeholder object-cover"
            />
          </a>
        ))}
        {hydrated && count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={labels.prev}
              className="absolute top-1/2 left-3 z-10 flex size-12 -translate-y-1/2 rotate-180 cursor-pointer items-center justify-center"
            >
              {ARROW}
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={labels.next}
              className="absolute top-1/2 right-3 z-10 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center"
            >
              {ARROW}
            </button>
          </>
        )}
      </div>
    </>
  );
}
