"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { FunnelStep } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { humanizeDates } from "../shared/format";
import { Icon } from "../shared/icon";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./funnel-view.module.css";

export function FunnelView({ steps, pending = false }: { steps: FunnelStep[]; pending?: boolean }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale];
  const reducedMotion = useReducedMotion();
  const maximum = Math.max(...steps.map((step) => step.before), 1);

  return (
    <section className={panelStyles.panel} aria-labelledby="manager-funnel-title">
      <PanelHeading
        titleId="manager-funnel-title"
        icon={<Icon><path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" /></Icon>}
        title={messages.funnel.title}
        description={messages.funnel.description}
        asideBelow
        aside={steps.length > 0 ? <strong className={styles.result}>{messages.funnel.result(steps[0]?.before ?? 0, steps.at(-1)?.after ?? 0)}</strong> : null}
      />
      {!steps.length ? (
        pending ? (
          <div className={styles.skeleton} aria-hidden="true"><span /><span /><span /><span /></div>
        ) : (
          <div className={styles.placeholder}><Icon><path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" /></Icon><p>{messages.funnel.placeholder}</p></div>
        )
      ) : (
        <ol className={styles.list}>
          {steps.map((step, index) => {
            const removed = Math.max(step.before - step.after, 0);
            const stepName = messages.steps[step.step] ?? step.step;
            return (
              <motion.li key={`${step.step}-${index}`} initial={reducedMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .26, delay: reducedMotion ? 0 : index * .045 }}>
                <div className={styles.stepHeading}><span aria-hidden="true">{index + 1}</span><strong>{stepName}</strong><em aria-label={messages.funnel.stepAria(stepName, step.before, step.after)}>{step.before} → {step.after}</em></div>
                <div className={styles.track} aria-hidden="true">
                  <span className={styles.before} style={{ width: `${(step.before / maximum) * 100}%` }} />
                  <motion.span className={styles.after} style={{ width: `${(step.after / maximum) * 100}%` }} initial={reducedMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reducedMotion ? 0 : .45, delay: reducedMotion ? 0 : index * .05 }} />
                </div>
                <p>
                  {step.before === 0
                    ? messages.funnel.nobodyLeft
                    : removed > 0
                      ? <><span className={styles.removedCount}>{messages.funnel.removed(removed)}</span> {humanizeDates(step.removedReason, locale)}</>
                      : messages.funnel.noneRemoved}
                </p>
              </motion.li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
