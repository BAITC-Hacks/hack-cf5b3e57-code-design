"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { BrandLogo } from "@/components/shared/brand-logo/brand-logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteCopy, type SiteCopy } from "./site-copy";
import styles from "./site.module.css";

type NavKey = "catalog" | "match" | "assistant" | "manager";

const NAV_ITEMS: readonly { href: string; key: NavKey }[] = [
  { href: "/", key: "catalog" },
  { href: "/match", key: "match" },
  { href: "/chat", key: "assistant" },
  { href: "/manager", key: "manager" },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/contractor");
  if (href === "/manager") {
    return pathname.startsWith("/manager") || pathname.startsWith("/admin");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  className,
  copy,
  onNavigate,
  pathname,
}: {
  className: string;
  copy: SiteCopy;
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <ul className={className}>
      {NAV_ITEMS.map(({ href, key }) => (
        <li key={href}>
          <Link
            aria-current={isActive(href, pathname) ? "page" : undefined}
            href={href}
            onClick={onNavigate}
          >
            {copy[key]}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader({ contentId = "main-content" }: { contentId?: string }) {
  const { locale } = useLocale();
  const copy = siteCopy[locale];
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <a className={styles.skip} href={`#${contentId}`}>
        {copy.skip}
      </a>
      <header className={styles.header} ref={headerRef}>
        <div className={styles.headerInner}>
          <BrandLogo ariaLabel={copy.brandAria} className={styles.brand} />

          <nav className={styles.nav} aria-label={copy.navigation}>
            <NavLinks className={styles.navList} copy={copy} pathname={pathname} />
          </nav>

          <div className={styles.headerActions}>
            <LocaleSwitcher ariaLabel={copy.language} className={styles.locale} />
            <Link className={styles.cta} href="/match">
              {copy.cta}
            </Link>
            <button
              aria-controls={menuId}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? copy.menuClose : copy.menuOpen}
              className={styles.menuButton}
              onClick={() => setMenuOpen((open) => !open)}
              ref={toggleRef}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6 6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.mobileMenu} hidden={!menuOpen} id={menuId}>
          <nav aria-label={copy.navigation}>
            <NavLinks
              className={styles.mobileList}
              copy={copy}
              onNavigate={closeMenu}
              pathname={pathname}
            />
          </nav>
          <Link className={styles.mobileCta} href="/match" onClick={closeMenu}>
            {copy.cta}
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="m7 4 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </header>
    </>
  );
}
