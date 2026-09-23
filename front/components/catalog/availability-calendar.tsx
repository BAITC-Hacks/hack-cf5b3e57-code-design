"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { ContractorDetail, Locale } from "../../../shared/contract";
import styles from "./availability-calendar.module.css";

const copy = {
  ru: { title: "Календарь занятости", lead: "Нажмите на дату — покажем, занят ли подрядчик.", busy: "Занят", unmarked: "Нет отметки о занятости", past: "Прошедшая дата", previous: "Предыдущие месяцы", next: "Следующие месяцы", select: "Выберите день в календаре", note: "Даты взяты из каталога. Если отметки нет, это ещё не гарантия — уточните у подрядчика.", check: "Подобрать с AI" },
  kk: { title: "Бос емес күндер күнтізбесі", lead: "Күнді басыңыз — мердігер бос па, жоқ па, көрсетеміз.", busy: "Бос емес", unmarked: "Бос емес деп белгіленбеген", past: "Өткен күн", previous: "Алдыңғы айлар", next: "Келесі айлар", select: "Күнтізбеден күнді таңдаңыз", note: "Күндер каталогтан алынған. Белгінің болмауы кепілдік емес — мердігерден нақтылаңыз.", check: "AI арқылы таңдау" },
  en: { title: "Availability calendar", lead: "Tap a date to see whether the contractor is booked.", busy: "Booked", unmarked: "Not marked as booked", past: "Past date", previous: "Previous months", next: "Next months", select: "Choose a day in the calendar", note: "Dates come from the catalog. No mark is not a guarantee — confirm with the contractor.", check: "Match with AI" },
};

// Explicit month names keep server and browser output identical
// (Node ICU and Chromium differ for kk-KZ, which broke hydration).
const MONTHS: Record<Locale, { title: readonly string[]; day: readonly string[] }> = {
  ru: {
    title: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    day: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  },
  kk: {
    title: ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"],
    day: ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"],
  },
  en: {
    title: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    day: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
};

const COMPACT_QUERY = "(max-width: 600px)";

function subscribeCompact(callback: () => void) {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }

export function AvailabilityCalendar({ contractor, locale, today }: {
  contractor: ContractorDetail;
  locale: Locale;
  today: string;
}) {
  const text = copy[locale];
  const compact = useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
  const visibleMonths = compact ? 1 : 4;
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState("");
  const start = new Date(`${today}T00:00:00Z`);
  const busy = new Set(contractor.busyDates);
  const months = MONTHS[locale];
  const monthFormat = {
    format: (date: Date) => `${months.title[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
  };
  const dayFormat = {
    format: (date: Date) =>
      `${date.getUTCDate()} ${months.day[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
  };
  const weekdays = locale === "kk" ? ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"] : locale === "en" ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const selectedStatus = selected
    ? busy.has(selected) ? text.busy : text.unmarked
    : "";

  return <section className={styles.calendar} aria-labelledby="availability-title">
    <div className={styles.heading}>
      <div><h2 id="availability-title">{text.title}</h2><p>{text.lead}</p></div>
      <div className={styles.navigation}>
        <button type="button" aria-label={text.previous} disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - visibleMonths))}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.5 4-6 6 6 6" /></svg>
        </button>
        <button type="button" aria-label={text.next} onClick={() => setOffset(value => value + visibleMonths)}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4 6 6-6 6" /></svg>
        </button>
      </div>
    </div>
    <ul className={styles.legend}>
      <li><span className={styles.swatch} aria-hidden="true" />{text.unmarked}</li>
      <li><span className={`${styles.swatch} ${styles.busySwatch}`} aria-hidden="true" />{text.busy}</li>
      <li><span className={`${styles.swatch} ${styles.pastSwatch}`} aria-hidden="true" />{text.past}</li>
    </ul>
    <div className={styles.months} data-count={visibleMonths}>
      {Array.from({ length: visibleMonths }, (_, index) => {
        const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset + index, 1));
        const length = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
        const padding = (month.getUTCDay() + 6) % 7;
        return <article className={styles.month} key={isoDate(month)}>
          <h3>{monthFormat.format(month)}</h3>
          <div className={styles.days}>
            {weekdays.map(day => <span className={styles.weekday} key={day} aria-hidden="true">{day}</span>)}
            {Array.from({ length: padding }, (_, pad) => <span key={`pad-${pad}`} aria-hidden="true" />)}
            {Array.from({ length }, (_, day) => {
              const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day + 1));
              const value = isoDate(date);
              const past = value < today;
              return <button type="button" key={value} disabled={past}
                className={busy.has(value) ? styles.busy : undefined}
                aria-pressed={selected === value}
                aria-label={`${dayFormat.format(date)}: ${past ? text.past : busy.has(value) ? text.busy : text.unmarked}`}
                onClick={() => setSelected(value)}>{day + 1}</button>;
            })}
          </div>
        </article>;
      })}
    </div>
    <div className={styles.feedback} data-state={selected ? (busy.has(selected) ? "busy" : "free") : "idle"}>
      <div>
        <p role="status" className={styles.status}>
          {selected ? <><strong>{dayFormat.format(new Date(`${selected}T00:00:00Z`))}</strong> — {selectedStatus}</> : text.select}
        </p>
        <p className={styles.note}>{text.note}</p>
      </div>
      {selected && <Link href="/match">{text.check}</Link>}
    </div>
  </section>;
}
