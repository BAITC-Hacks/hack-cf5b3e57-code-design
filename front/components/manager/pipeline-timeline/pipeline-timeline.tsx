"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { SseEventType } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { Icon } from "../shared/icon";
import type { TimelineItem } from "../shared/manager-types";
import styles from "./pipeline-timeline.module.css";

function TimelineIcon({ type }: { type: SseEventType }) {
  if (type === "filter_step") return <Icon><path d="M4 5h16M7 12h10M10 19h4" /></Icon>;
  if (type === "card") return <Icon><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h5" /></Icon>;
  if (type === "critic") return <Icon><path d="m5 12 4 4L19 6" /></Icon>;
  if (type === "ranked") return <Icon><path d="M7 18V9m5 9V5m5 13v-6" /></Icon>;
  if (type === "done") return <Icon><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8" /></Icon>;
  return <Icon><path d="M12 3 4 7v5c0 4.8 3.4 7.7 8 9 4.6-1.3 8-4.2 8-9V7l-8-4Z" /><path d="M9 12h6" /></Icon>;
}

export function PipelineTimeline({ timeline, streaming, error, onRetry }: {
  timeline: TimelineItem[];
  streaming: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].pipeline;
  const reducedMotion = useReducedMotion();

  return (
    <section className={styles.panel} aria-label={messages.aria}>
      <div className={styles.headingRow}>
        <div className={styles.heading}><span className={styles.headingIcon}><Icon><path d="M4 12h4l2-6 4 12 2-6h4" /></Icon></span><div><span className={styles.index}>{messages.section}</span><h2>{messages.title}</h2></div></div>
        <span className={styles.live}><span aria-hidden="true" /> {messages.live}</span>
      </div>
      <div className={styles.timeline} aria-live="polite">
        {timeline.length ? (
          <ol>
            <AnimatePresence initial={false}>
              {timeline.map((item, index) => (
                <motion.li key={item.id} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .26 }}>
                  <span className={styles.line} aria-hidden="true" /><span className={styles.eventIcon}><TimelineIcon type={item.type} /></span>
                  <div><span className={styles.meta}>{messages.step} {String(index + 1).padStart(2, "0")} · {item.time}</span><strong>{item.title}</strong><p>{item.detail}</p></div>
                </motion.li>
              ))}
            </AnimatePresence>
            {streaming && <li className={styles.pending}><span className={styles.line} aria-hidden="true" /><span className={styles.loadingDot} aria-hidden="true" /><div><strong>{messages.waitingTitle}</strong><p>{messages.waitingDescription}</p></div></li>}
          </ol>
        ) : (
          <div className={styles.empty}><div className={styles.illustration} aria-hidden="true"><span>01</span><i /><span>02</span><i /><span>03</span></div><h3>{messages.emptyTitle}</h3><p>{messages.emptyDescription}</p></div>
        )}
      </div>
      {error && <div className={styles.error} role="alert"><Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></Icon><div><strong>{messages.interrupted}</strong><p>{error}</p></div><button type="button" onClick={onRetry}>{messages.retry}</button></div>}
    </section>
  );
}
