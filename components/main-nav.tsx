import Link from "next/link";
import { cn } from "@/lib/utils";
import CloseIcon from "@/components/icons/close";
import MenuIcon from "@/components/icons/menu";

type MainNavProps = {
  active?: "Default" | "Projets";
};

export default function MainNav({ active = "Projets" }: MainNavProps) {
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

  const closeItem = () => {
    return (
      <div
        className={cn(
          "h-full pt-[2px] pr-0 pl-2",
          "flex lg:hidden",
          "border-l border-black"
        )}
      >
        <CloseIcon />
      </div>
    );
  };

  const menuItem = () => {
    return (
      <div
        className={cn(
          "h-full pt-[2px] pr-0 pl-2",
          "flex lg:hidden",
          "border-l border-black"
        )}
      >
        <MenuIcon />
      </div>
    );
  };

  const projectsSubNavItems = [
    { label: "Édition", link: "/edition" },
    { label: "Signalétique", link: "/signaletique" },
    { label: "Identité", link: "/identite" },
    { label: "Archives", link: "/archives" },
  ];

  return (
    <nav className="flex w-full items-center justify-end border-b border-black">
      {logo}
      {navItem("Projets", "/projets", active === "Projets")}
      {active === "Projets" &&
        projectsSubNavItems.map((item) =>
          navItem(item.label, item.link, false, true)
        )}
      {menuItem()}
      {navItem("Infos", "/infos")}
      {navItem("Contact", "/contact")}
    </nav>
  );
}
