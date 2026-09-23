"use client";

import Link from "next/link";
import { useState } from "react";
import type { ContractorDetail, Locale } from "../../../shared/contract";
import styles from "./availability-calendar.module.css";

const copy = {
  ru: { title: "Календарь занятости", lead: "Выберите дату, чтобы посмотреть отметку занятости.", busy: "Занят", unmarked: "Нет отметки занятости", past: "Прошедшая дата", previous: "Предыдущие месяцы", next: "Следующие месяцы", select: "Выберите день в календаре", note: "Даты взяты из каталога. Отсутствие отметки занятости не гарантирует доступность — уточните её у подрядчика.", check: "Подобрать с ИИ" },
  kk: { title: "Бос емес күндер күнтізбесі", lead: "Бос емес күндерді көру үшін күнді таңдаңыз.", busy: "Бос емес", unmarked: "Бос емес деп белгіленбеген", past: "Өткен күн", previous: "Алдыңғы айлар", next: "Келесі айлар", select: "Күнтізбеден күнді таңдаңыз", note: "Күндер каталогтан алынған. Белгінің болмауы қолжетімділікке кепілдік бермейді — мердігерден нақтылаңыз.", check: "ЖИ арқылы таңдау" },
  en: { title: "Availability calendar", lead: "Choose a date to see its recorded availability.", busy: "Busy", unmarked: "No busy date recorded", past: "Past date", previous: "Previous months", next: "Next months", select: "Choose a day in the calendar", note: "Dates come from the catalog. No busy date recorded does not guarantee availability — confirm with the contractor.", check: "Match with AI" },
};

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }

export function AvailabilityCalendar({ contractor, locale, today }: {
  contractor: ContractorDetail;
  locale: Locale;
  today: string;
}) {
  const text = copy[locale];
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState("");
  const start = new Date(`${today}T00:00:00Z`);
  const busy = new Set(contractor.busyDates);
  const intlLocale = locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU";
  const monthFormat = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric", timeZone: "UTC" });
  const dayFormat = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const weekdays = locale === "kk" ? ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"] : locale === "en" ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return <section className={styles.calendar} aria-labelledby="availability-title">
    <div className={styles.heading}>
      <div><h2 id="availability-title">{text.title}</h2><p>{text.lead}</p></div>
      <div className={styles.navigation}>
        <button type="button" aria-label={text.previous} disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 4))}>←</button>
        <button type="button" aria-label={text.next} onClick={() => setOffset(value => value + 4)}>→</button>
      </div>
    </div>
    <div className={styles.legend}><span>{text.unmarked}</span><span className={styles.busyLegend}>{text.busy}</span><span className={styles.pastLegend}>{text.past}</span></div>
    <div className={styles.months}>
      {[0, 1, 2, 3].map(index => {
        const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset + index, 1));
        const length = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
        const padding = (month.getUTCDay() + 6) % 7;
        return <article className={styles.month} key={isoDate(month)}>
          <h3>{monthFormat.format(month)}</h3>
          <div className={styles.days}>
            {weekdays.map(day => <span className={styles.weekday} key={day}>{day}</span>)}
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
    <div className={styles.feedback}>
      <div><p role="status">{selected ? `${dayFormat.format(new Date(`${selected}T00:00:00Z`))}: ${busy.has(selected) ? text.busy : text.unmarked}` : text.select}</p><p className={styles.note}>{text.note}</p></div>
      {selected && <Link href="/match">{text.check}</Link>}
    </div>
  </section>;
}
