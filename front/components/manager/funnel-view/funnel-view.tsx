"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { FunnelStep } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { Icon } from "../shared/icon";
import styles from "./funnel-view.module.css";

export function FunnelView({ steps }: { steps: FunnelStep[] }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale];
  const reducedMotion = useReducedMotion();
  const maximum = Math.max(...steps.map((step) => step.before), 1);

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div><span>{messages.funnel.section}</span><h2>{messages.funnel.title}</h2><p>{messages.funnel.description}</p></div>
        {steps.length > 0 && <strong>{messages.funnel.result(steps[0]?.before ?? 0, steps.at(-1)?.after ?? 0)}</strong>}
      </div>
      {!steps.length ? (
        <div className={styles.placeholder}><Icon><path d="M4 5h16M7 12h10M10 19h4" /></Icon><p>{messages.funnel.placeholder}</p></div>
      ) : (
        <ol className={styles.list}>
          {steps.map((step, index) => {
            const removed = Math.max(step.before - step.after, 0);
            return (
              <motion.li key={`${step.step}-${index}`} initial={reducedMotion ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .28, delay: reducedMotion ? 0 : index * .045 }}>
                <div className={styles.stepHeading}><span>{index + 1}</span><strong>{messages.steps[step.step]}</strong><em>{step.before} → {step.after}</em></div>
                <div className={styles.track} aria-hidden="true"><motion.span style={{ width: `${Math.max((step.after / maximum) * 100, 2)}%` }} initial={reducedMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reducedMotion ? 0 : .48, delay: reducedMotion ? 0 : index * .055 }} /></div>
                <p>{removed > 0 ? messages.funnel.removed(removed) : messages.funnel.noneRemoved} {step.removedReason}</p>
              </motion.li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
