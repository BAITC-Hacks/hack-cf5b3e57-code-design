"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";

import type { MatchMessages } from "@/lib/i18n/messages/match";
import styles from "./mascot-guide.module.css";

type MascotVariant = "hello" | "thinking" | "found" | "sorry";

interface MascotGuideProps {
  compact?: boolean;
  copy: MatchMessages["mascot"];
  message?: string;
  variant: MascotVariant;
}

export function MascotGuide({
  compact = false,
  copy,
  message,
  variant,
}: MascotGuideProps) {
  const reducedMotion = useReducedMotion();
  const alt = copy.alt[variant];
  const showVideo = variant === "hello" && !reducedMotion;

  return (
    <figure className={`${styles.guide}${compact ? ` ${styles.compact}` : ""}`}>
      <div className={styles.portrait} role="img" aria-label={alt}>
        {showVideo ? (
          <video autoPlay loop muted playsInline poster="/mascot/nurlan-hello.webp">
            <source src="/mascot/nurlan-hello.webm" type="video/webm" />
            <source src="/mascot/nurlan-hello.mp4" type="video/mp4" />
          </video>
        ) : (
          <Image
            alt=""
            fill
            sizes={compact ? "96px" : "(max-width: 680px) 180px, 280px"}
            src={`/mascot/nurlan-${variant}.webp`}
          />
        )}
      </div>
      {message ? (
        <figcaption className={styles.message}>
          <strong>{copy.name}</strong>
          <span>{message}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
