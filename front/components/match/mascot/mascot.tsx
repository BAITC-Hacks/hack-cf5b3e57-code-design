"use client";

import { useEffect, useState } from "react";
import styles from "./mascot.module.css";

interface MascotProps {
  pose: "hello" | "thinking" | "found" | "sorry";
  speech: string;
  name: string;
}

export function Mascot({ pose, speech, name }: MascotProps) {
  // Start with a still image so reduced-motion users never see autoplay before hydration.
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return (
    <aside className={styles.mascot} aria-label={name}>
      <div className={`${styles.avatar} ${pose === "hello" ? styles.hello : ""}`}>
        {pose === "hello" && motionAllowed ? (
          <video autoPlay muted loop playsInline poster="/mascot/nurlan-hello.webp" aria-hidden="true">
            <source src="/mascot/nurlan-hello.webm" type="video/webm" />
            <source src="/mascot/nurlan-hello.mp4" type="video/mp4" />
          </video>
        ) : (
          // Native img keeps the requested static asset as the reduced-motion fallback.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/mascot/nurlan-${pose}.webp`} alt="" width={160} height={160} />
        )}
      </div>
      <p className={styles.bubble}>{speech}</p>
    </aside>
  );
}
