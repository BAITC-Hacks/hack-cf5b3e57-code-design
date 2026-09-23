import type { ReactNode } from "react";

import styles from "./panel.module.css";

/**
 * Shared panel header: icon tile, title, optional description and a right-side badge.
 * `asideBelow` moves a long badge under the title on phones instead of squeezing the title.
 */
export function PanelHeading({ icon, title, description, aside, asideBelow = false, titleId }: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  asideBelow?: boolean;
  titleId?: string;
}) {
  return (
    <div className={styles.heading}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <div className={styles.titles}>
        <h2 id={titleId}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {aside && <div className={`${styles.aside}${asideBelow ? ` ${styles.asideBelow}` : ""}`}>{aside}</div>}
    </div>
  );
}

export const panelStyles = styles;
