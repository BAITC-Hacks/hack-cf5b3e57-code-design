"use client";

import type { Ref } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { SseEventType } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { humanizeDates } from "../shared/format";
import { Icon } from "../shared/icon";
import type { TimelineItem } from "../shared/manager-types";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./pipeline-timeline.module.css";

function TimelineIcon({ type }: { type: SseEventType }) {
  if (type === "filter_step") return <Icon><path d="M4 5h16M7 12h10M10 19h4" /></Icon>;
  if (type === "card") return <Icon><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h5" /></Icon>;
  if (type === "critic") return <Icon><path d="m5 12 4 4L19 6" /></Icon>;
  if (type === "ranked") return <Icon><path d="M7 18V9m5 9V5m5 13v-6" /></Icon>;
  if (type === "done") return <Icon><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8" /></Icon>;
  return <Icon><path d="M11 4.5 12.8 9.7 18 11.5l-5.2 1.8L11 18.5l-1.8-5.2L4 11.5l5.2-1.8L11 4.5Z" /><path d="M18.5 3v3.5M16.75 4.75h3.5" /></Icon>;
}

const isAiStep = (type: SseEventType) => type === "criteria" || type === "card";

export function PipelineTimeline({ timeline, streaming, error, onRetry, ref }: {
  timeline: TimelineItem[];
  streaming: boolean;
  error: string | null;
  onRetry: () => void;
  ref?: Ref<HTMLElement>;
}) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].pipeline;
  const reducedMotion = useReducedMotion();
  const finished = !streaming && !error && timeline.some((item) => item.type === "done");
  const badge = streaming
    ? <span className={`${styles.live} ${styles.liveOn}`}><span aria-hidden="true" />{messages.live}</span>
    : finished ? <span className={`${styles.live} ${styles.liveDone}`}>{messages.liveDone}</span> : null;

  return (
    <section ref={ref} className={`${panelStyles.panel} ${styles.panel}`} aria-labelledby="manager-timeline-title">
      <PanelHeading
        titleId="manager-timeline-title"
        icon={<Icon><path d="M4 12h4l2-6 4 12 2-6h4" /></Icon>}
        title={messages.title}
        description={messages.description}
        asideBelow
        aside={badge}
      />
      {(timeline.length > 0 || streaming) && (
        <p className={styles.legend}>
          <span><span className={`${styles.chip} ${styles.chipAi}`}>{messages.ai}</span>{messages.aiHint}</span>
          <span><span className={`${styles.chip} ${styles.chipCode}`}>{messages.code}</span>{messages.codeHint}</span>
        </p>
      )}
      <div className={styles.timeline} aria-live="polite">
        {timeline.length || streaming ? (
          <ol>
            <AnimatePresence initial={false}>
              {timeline.map((item, index) => {
                const ai = isAiStep(item.type);
                return (
                  <motion.li key={item.id} className={ai ? styles.ai : styles.code} initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .24 }}>
                    <span className={styles.line} aria-hidden="true" />
                    <span className={styles.eventIcon}><TimelineIcon type={item.type} /></span>
                    <div className={styles.body}>
                      <span className={styles.meta}>
                        <span>{messages.step} {index + 1}</span>
                        <span className={`${styles.chip} ${ai ? styles.chipAi : styles.chipCode}`}>{ai ? messages.ai : messages.code}</span>
                        <time>{item.time}</time>
                      </span>
                      <strong>{item.title}</strong>
                      <p>{humanizeDates(item.detail, locale)}</p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {streaming && (
              <li className={styles.pending}>
                <span className={styles.line} aria-hidden="true" />
                <span className={styles.loadingDot} aria-hidden="true" />
                <div className={styles.body}><strong>{messages.waitingTitle}</strong><p>{messages.waitingDescription}</p></div>
              </li>
            )}
          </ol>
        ) : error ? null : (
          <div className={styles.empty}>
            <div className={styles.illustration} aria-hidden="true">
              <span><Icon><path d="M4 6h16M4 12h10M4 18h7" /></Icon></span><i />
              <span><Icon><path d="M4 5h16M7 12h10M10 19h4" /></Icon></span><i />
              <span><Icon><path d="M11 4.5 12.8 9.7 18 11.5l-5.2 1.8L11 18.5l-1.8-5.2L4 11.5l5.2-1.8L11 4.5Z" /><path d="M18.5 3v3.5M16.75 4.75h3.5" /></Icon></span><i />
              <span><Icon><path d="m5 12 4 4L19 6" /></Icon></span>
            </div>
            <h3>{messages.emptyTitle}</h3>
            <p>{messages.emptyDescription}</p>
          </div>
        )}
      </div>
      {error && (
        <div className={styles.error} role="alert">
          <Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></Icon>
          <div><strong>{messages.interrupted}</strong><p>{error}</p></div>
          <button type="button" onClick={onRetry}>{messages.retry}</button>
        </div>
      )}
    </section>
  );
}
