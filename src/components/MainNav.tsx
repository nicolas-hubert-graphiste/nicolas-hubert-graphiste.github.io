import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  localePath,
  otherLocale,
  showLocaleSwitch,
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

/** `key` is the section name matched against `<html data-section>`. */
type Item = { key: string; label: string; href: string };

/*
 * The same menu on every page: the studio name, the four sections, then
 * "Infos, contact".
 *
 * Geometry is taken from the design PDFs (site_nhab_2026_ordi and
 * site_nh_2026_iPhone), measured at 4x:
 *
 * Phone:   nav 35px tall + 0.5px rule; logo 24px; divider 0.5px; menu icon
 *          26x16 starting 13px after the divider, 1px in from the edge.
 *          Open menu: a hairline 194px down, the sections on a 45px rhythm,
 *          a second hairline, then "Infos, contact".
 * Desktop: nav 50px tall + 1px rule; 26px text; dividers 1px; 13px between
 *          section names.
 *
 * The cells stretch to the nav's height (`items-stretch`), so every divider
 * runs from the top of the nav down to the rule.
 *
 * Colours inherit from `body[data-theme]` (see global.css) so the home
 * slideshow can flip the chrome between black and white per slide.
 *
 * The item for the current section is greyed by global.css from
 * `<html data-section>` (set in Base.astro), not from state here, so the
 * static HTML is already right before this island hydrates.
 */
export default function MainNav({ currentPath, locale }: MainNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const tr = t(locale);
  const path = stripLocale(currentPath);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    // Lets the header turn white behind the open menu (see global.css).
    document.body.toggleAttribute("data-menu-open", isMenuOpen);
    return () => {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-menu-open");
    };
  }, [isMenuOpen]);

  const ink = isMenuOpen ? "text-black" : "text-current";
  const line = isMenuOpen ? "border-black" : "border-current";

  const sections: Item[] = CATEGORIES.map((category) => ({
    key: category,
    label: tr(`category.${category}`),
    href: `/projets/${category}/`,
  }));
  const infos: Item = {
    key: "infos",
    label: tr("nav.infosContact"),
    href: "/infos/",
  };
  const switchHref = localePath(otherLocale(locale), path);

  const link = (item: Item, className?: string) => (
    <a
      key={item.key}
      href={localePath(locale, item.href)}
      className={className}
      data-nav={item.key}
      aria-current={path === item.href ? "page" : undefined}
    >
      {/* The label is what global.css greys for the current section. */}
      <span>{item.label}</span>
    </a>
  );

  /** Desktop cell between two dividers; text sits 2px below the nav top. */
  const cell = (children: React.ReactNode, className: string) => (
    <div className={cn("flex items-start border-l pt-[2px]", line, className)}>
      {children}
    </div>
  );

  /** Phone menu line: 30px text on a 45px rhythm. */
  const menuLine = (item: Item, className = "pt-[6px]") =>
    link(
      item,
      cn("block pb-[5px] text-5xl leading-[34px] text-black", className)
    );

  return (
    <>
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-30 overflow-y-auto bg-white lg:hidden"
        >
          <div
            className="flex flex-col px-2 pt-[194px] pb-10"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                setIsMenuOpen(false);
              }
            }}
          >
            <div className="flex flex-col border-t-[0.5px] border-black pt-[2px]">
              {sections.map((item) => menuLine(item))}
            </div>
            <div className="mt-[48.25px] flex flex-col border-t-[0.5px] border-black">
              {menuLine(infos, "pt-[2px]")}
            </div>
            {showLocaleSwitch && (
              <a
                href={switchHref}
                lang={otherLocale(locale)}
                aria-label={tr("nav.switchLocaleLabel")}
                className="mt-[45px] text-3xl text-black"
              >
                {tr("nav.switchLocale")}
              </a>
            )}
          </div>
        </div>
      )}

      <nav
        className={cn(
          "relative z-40 flex h-[35.5px] w-full items-stretch border-b-[0.5px] lg:h-[51px] lg:border-b",
          line,
          ink
        )}
        aria-label="Navigation principale"
      >
        <a
          href={localePath(locale, "/")}
          className="flex grow basis-0 items-start pr-3 text-3xl leading-[26px] lg:pt-[2px] lg:text-4xl lg:leading-[30px]"
        >
          <span className="relative -top-[2.25px] lg:top-0">
            {tr("siteTitle")}
          </span>
        </a>

        <div className="hidden items-stretch text-4xl leading-[30px] lg:flex">
          {cell(
            <div className="flex gap-[12.75px]">
              {sections.map((item) => link(item))}
            </div>,
            "pr-[12.75px] pl-[15.25px]"
          )}
          {cell(link(infos), "pr-0 pl-[12.2px]")}
          {showLocaleSwitch && (
            <div className="flex items-start pt-[2px] pl-3">
              <a
                href={switchHref}
                lang={otherLocale(locale)}
                aria-label={tr("nav.switchLocaleLabel")}
                className="text-xl opacity-60 hover:opacity-100"
              >
                {tr("nav.switchLocale")}
              </a>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className={cn(
            "relative w-[40.5px] shrink-0 cursor-pointer border-l-[0.5px] lg:hidden",
            // Invisible hit area so the target is at least 44px tall.
            "after:absolute after:-inset-y-[5px] after:-right-[10px] after:left-0 after:content-['']",
            line
          )}
          aria-label={isMenuOpen ? tr("nav.menuClose") : tr("nav.menuOpen")}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? (
            <CloseIcon className="absolute top-[2px] left-[18px] text-black" />
          ) : (
            <MenuIcon className="absolute top-[3px] left-[13px]" />
          )}
        </button>
      </nav>
    </>
  );
}
