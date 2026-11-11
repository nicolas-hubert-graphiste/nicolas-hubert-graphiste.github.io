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

type Item = { label: string; href: string };

/*
 * Geometry is taken from the design PDFs (site_nh_2025_12-04 and the iPhone
 * version), measured at 4x:
 *
 * Phone:   nav 35px tall + 0.5px rule; logo 24px; divider 0.5px; menu icon
 *          26x16 starting 13px after the divider, 1px in from the edge.
 * Desktop: nav 50px tall + 1px rule; 26px text; dividers 1px.
 *
 * The cells stretch to the nav's height (`items-stretch`), so every divider
 * runs from the top of the nav down to the rule.
 *
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
    // Lets the header turn white behind the open menu (see global.css).
    document.body.toggleAttribute("data-menu-open", isMenuOpen);
    return () => {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-menu-open");
    };
  }, [isMenuOpen]);

  const ink = isMenuOpen ? "text-black" : "text-current";
  const line = isMenuOpen ? "border-black" : "border-current";

  const projets: Item = { label: tr("nav.projets"), href: "/projets/" };
  const infos: Item = { label: tr("nav.infos"), href: "/infos/" };
  const contact: Item = { label: tr("nav.contact"), href: "/contact/" };
  const categories: Item[] = CATEGORIES.map((category) => ({
    label: tr(`category.${category}`),
    href: `/projets/${category}/`,
  }));
  const switchHref = localePath(otherLocale(locale), path);

  const link = (item: Item, className?: string) => (
    <a
      key={item.href}
      href={localePath(locale, item.href)}
      className={className}
      aria-current={isActive(item.href) ? "page" : undefined}
    >
      {/* Grey only the label, so a rule under the link stays black. */}
      <span className={cn(isActive(item.href) && "opacity-30")}>
        {item.label}
      </span>
    </a>
  );

  /** Desktop cell between two dividers; text sits 2px below the nav top. */
  const cell = (children: React.ReactNode, className: string) => (
    <div className={cn("flex items-start border-l pt-[2px]", line, className)}>
      {children}
    </div>
  );

  /** Phone menu line: 30px text on a 45px rhythm, optional hairline rule. */
  const menuLine = (item: Item, ruled: boolean) =>
    link(
      item,
      cn(
        "block pt-[6px] text-5xl leading-[34px] text-black",
        ruled ? "border-b-[0.5px] border-black pb-[4px]" : "pb-[5px]"
      )
    );

  return (
    <>
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-30 overflow-y-auto bg-white lg:hidden"
        >
          <div
            className="flex flex-col px-2 pt-[150px] pb-10"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                setIsMenuOpen(false);
              }
            }}
          >
            {menuLine(projets, true)}
            {categories.map((item) => menuLine(item, false))}
            <div className="mt-[45px] flex flex-col">
              {menuLine(infos, true)}
              {menuLine(contact, true)}
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
          {cell(link(projets), "pr-[13.2px] pl-[14px]")}
          {onProjets &&
            cell(
              <div className="flex gap-[19px]">
                {categories.map((item) => link(item))}
              </div>,
              "pr-[12.7px] pl-[11.2px]"
            )}
          {cell(link(infos), "pr-[13.8px] pl-[11.7px]")}
          {cell(link(contact), "pr-0 pl-[11px]")}
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
