import Image from "next/image";
import Link from "next/link";

import styles from "./brand-logo.module.css";

interface BrandLogoProps {
  ariaLabel: string;
  className?: string;
  href?: string;
  light?: boolean;
  tagline?: string;
}

export function BrandLogo({
  ariaLabel,
  className,
  href = "/",
  light = false,
  tagline,
}: BrandLogoProps) {
  return (
    <Link
      aria-label={ariaLabel}
      className={`${styles.brand}${className ? ` ${className}` : ""}`}
      href={href}
    >
      <Image
        alt=""
        className={styles.logo}
        height={295}
        priority
        src={light ? "/brand/toimatch-logo-light.svg" : "/brand/toimatch-logo.svg"}
        width={1844}
      />
      {tagline ? <small>{tagline}</small> : null}
    </Link>
  );
}
