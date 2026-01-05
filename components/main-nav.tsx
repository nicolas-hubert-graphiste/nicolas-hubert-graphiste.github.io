"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import CloseIcon from "@/components/icons/close";
import MenuIcon from "@/components/icons/menu";

type MainNavProps = {
  active?: "Default" | "Projets";
};

export default function MainNav({ active = "Projets" }: MainNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const logo = (
    <div className="flex grow basis-0 items-center pt-[2px] pr-3 pb-2 lg:pb-3">
      <p className="text-3xl text-black lg:text-4xl">NH & AB graphistes</p>
    </div>
  );

  const navItem = (
    label: string,
    link: string = "/projets",
    isActive: boolean = false,
    isSubNav: boolean = false
  ) => {
    return (
      <div
        key={label}
        className={cn(
          "h-full pt-[2px] pr-3 pl-2 last:pr-0",
          "hidden lg:flex",
          !isSubNav && "border-l border-black"
        )}
      >
        <Link href={link}>
          <p className={cn("text-4xl text-black", isActive && "opacity-30")}>
            {label}
          </p>
        </Link>
      </div>
    );
  };

  const mobileNavItem = (
    label: string,
    link: string = "/projets",
    isSubNav: boolean = false
  ) => {
    return (
      <div key={label} className={cn(!isSubNav && "border-b border-black")}>
        <Link href={link} onClick={toggleMenu}>
          <p className="text-5xl text-black">{label}</p>
        </Link>
      </div>
    );
  };

  const menuToggleButton = () => {
    return (
      <button
        onClick={toggleMenu}
        className={cn(
          "h-full pt-[2px] pr-0 pl-2",
          "flex lg:hidden",
          "border-l border-black",
          "cursor-pointer"
        )}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
    );
  };

  const projectsSubNavItems = [
    { label: "Édition", link: "/edition" },
    { label: "Signalétique", link: "/signaletique" },
    { label: "Identité", link: "/identite" },
    { label: "Archives", link: "/archives" },
  ];

  return (
    <>
      {/* Mobile Menu Overlay - Full screen behind nav */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 bg-white lg:hidden">
          <div className="flex flex-col gap-2 p-2 pt-20">
            {mobileNavItem("Projets", "/projets")}
            <div className="mb-6 flex flex-col">
              {projectsSubNavItems.map((item) =>
                mobileNavItem(item.label, item.link, true)
              )}
            </div>
            {mobileNavItem("Infos", "/infos")}
            {mobileNavItem("Contact", "/contact")}
          </div>
        </div>
      )}

      <nav className="relative z-40 flex w-full items-center justify-end border-b border-black">
        {logo}
        {navItem("Projets", "/projets", active === "Projets")}
        {active === "Projets" &&
          projectsSubNavItems.map((item) =>
            navItem(item.label, item.link, false, true)
          )}
        {menuToggleButton()}
        {navItem("Infos", "/infos")}
        {navItem("Contact", "/contact")}
      </nav>
    </>
  );
}
