"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./category-strip.module.css";

interface CategoryStripProps {
  ariaLabel: string;
  children: ReactNode;
  className: string;
  listClassName: string;
  nextLabel: string;
  previousLabel: string;
}

export function CategoryStrip({
  ariaLabel,
  children,
  className,
  listClassName,
  nextLabel,
  previousLabel,
}: CategoryStripProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateControls = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const maxScrollLeft = list.scrollWidth - list.clientWidth;
    setCanScrollBack(list.scrollLeft > 1);
    setCanScrollForward(list.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const maxScrollLeft = list.scrollWidth - list.clientWidth;
      const nextScrollLeft = Math.max(
        0,
        Math.min(maxScrollLeft, list.scrollLeft + event.deltaY),
      );

      if (nextScrollLeft === list.scrollLeft) return;

      event.preventDefault();
      list.scrollLeft = nextScrollLeft;
    };

    updateControls();
    const resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(list);
    list.addEventListener("scroll", updateControls, { passive: true });
    list.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      resizeObserver.disconnect();
      list.removeEventListener("scroll", updateControls);
      list.removeEventListener("wheel", handleWheel);
    };
  }, [updateControls]);

  const scroll = (direction: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;

    list.scrollBy({
      behavior: "smooth",
      left: direction * Math.max(240, list.clientWidth * 0.7),
    });
  };

  return (
    <nav className={`${className} ${styles.root}`} aria-label={ariaLabel}>
      <button
        aria-label={previousLabel}
        className={`${styles.arrow} ${styles.previous}`}
        disabled={!canScrollBack}
        onClick={() => scroll(-1)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <ul className={listClassName} ref={listRef}>
        {children}
      </ul>
      <button
        aria-label={nextLabel}
        className={`${styles.arrow} ${styles.next}`}
        disabled={!canScrollForward}
        onClick={() => scroll(1)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
}
