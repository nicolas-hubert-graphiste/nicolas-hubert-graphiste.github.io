import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  localePath,
  otherLocale,
  stripLocale,
  t,
  type Locale,
} from "@/i18n/ui";
import { CATEGORIES } from "@/lib/categories";
import CloseIcon from "@/components/icons/Close";
import MenuIcon from "@/components/icons/Menu";

type MainNavProps = {
  currentPath: string;
  locale: Locale;
};

/**
 * Colours inherit from `body[data-theme]` (see global.css) so the home
 * slideshow can flip the chrome between black and white per slide.
 */
export default function MainNav({ currentPath, locale }: MainNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const tr = t(locale);
  const path = stripLocale(currentPath);
  const onProjets = path.startsWith("/projets");
  const isActive = (href: string) =>
    href === "/projets/" ? path === "/projets/" : path.startsWith(href);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const ink = isMenuOpen ? "text-black" : "text-current";
  const rule = isMenuOpen ? "border-black" : "border-current";

  const primary = [
    { label: tr("nav.projets"), href: "/projets/" },
    { label: tr("nav.infos"), href: "/infos/" },
    { label: tr("nav.contact"), href: "/contact/" },
  ];
  const categories = CATEGORIES.map((category) => ({
    label: tr(`category.${category}`),
    href: `/projets/${category}/`,
  }));
  const switchHref = localePath(otherLocale(locale), path);

  const desktopItem = (
    item: { label: string; href: string },
    options: { sub?: boolean } = {}
  ) => (
    <div
      key={item.href}
      className={cn(
        "hidden h-full items-center pt-[2px] pr-3 pl-2 last:pr-0 lg:flex",
        !options.sub && ["border-l", rule]
      )}
    >
      <a
        href={localePath(locale, item.href)}
        className={cn(
          "text-3xl lg:text-4xl",
          ink,
          isActive(item.href) && "opacity-30"
        )}
        aria-current={isActive(item.href) ? "page" : undefined}
      >
        {item.label}
      </a>
    </div>
  );

  const mobileItem = (
    item: { label: string; href: string },
    options: { sub?: boolean } = {}
  ) => (
    <a
      key={item.href}
      href={localePath(locale, item.href)}
      onClick={() => setIsMenuOpen(false)}
      className={cn(
        "block py-1 text-5xl text-black",
        !options.sub && "border-b border-black",
        isActive(item.href) && "opacity-30"
      )}
    >
      {item.label}
    </a>
  );

  return (
    <>
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-30 overflow-y-auto bg-white lg:hidden"
        >
          <div className="flex flex-col px-3 pt-24 pb-10">
            {mobileItem(primary[0]!)}
            <div className="mb-14 flex flex-col pt-2">
              {categories.map((item) => mobileItem(item, { sub: true }))}
            </div>
            {mobileItem(primary[1]!)}
            {mobileItem(primary[2]!)}
            <a
              href={switchHref}
              lang={otherLocale(locale)}
              aria-label={tr("nav.switchLocaleLabel")}
              className="mt-14 text-3xl text-black"
            >
              {tr("nav.switchLocale")}
            </a>
          </div>
        </div>
      )}

      <nav
        className={cn(
          "relative z-40 flex w-full items-center justify-end border-b",
          rule
        )}
        aria-label="Navigation principale"
      >
        <div className="flex grow basis-0 items-center pt-[2px] pr-3 pb-2 lg:pb-3">
          <a
            href={localePath(locale, "/")}
            className={cn("text-3xl lg:text-4xl", ink)}
          >
            {tr("siteTitle")}
          </a>
        </div>

        {desktopItem(primary[0]!)}
        {onProjets &&
          categories.map((item) => desktopItem(item, { sub: true }))}
        {desktopItem(primary[1]!)}
        {desktopItem(primary[2]!)}
        <div className={cn("hidden h-full items-center pt-[2px] pl-3 lg:flex")}>
          <a
            href={switchHref}
            lang={otherLocale(locale)}
            aria-label={tr("nav.switchLocaleLabel")}
            className={cn("text-xl", ink, "opacity-60 hover:opacity-100")}
          >
            {tr("nav.switchLocale")}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className={cn(
            "flex h-full min-h-[44px] min-w-[44px] cursor-pointer items-center justify-end border-l pl-3 lg:hidden",
            rule
          )}
          aria-label={isMenuOpen ? tr("nav.menuClose") : tr("nav.menuOpen")}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? (
            <CloseIcon className="size-[24px] text-black" />
          ) : (
            <MenuIcon className={cn("size-[24px]", ink)} />
          )}
        </button>
      </nav>
    </>
  );
}
