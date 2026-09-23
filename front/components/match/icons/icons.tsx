import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  "aria-hidden": true,
  fill: "none",
  viewBox: "0 0 24 24",
} as const;

export function SparkIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="M12 2.8c.52 4.7 2.82 7 7.2 7.52-4.38.52-6.68 2.82-7.2 7.52-.52-4.7-2.82-7-7.2-7.52C9.18 9.8 11.48 7.5 12 2.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M19 16v4M17 18h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m5 12.5 4.3 4.3L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M6.3 8.2h4.2v4.2c0 2.35-1.3 3.72-3.9 4.1M13.5 8.2h4.2v4.2c0 2.35-1.3 3.72-3.9 4.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10h17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 19c.35-3.45 2.08-5.2 5.2-5.2s4.85 1.75 5.2 5.2M15.5 5.6a2.7 2.7 0 0 1 0 5.2M16 14c2.54.22 3.93 1.87 4.2 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 7h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="9" cy="7" r="2.2" fill="currentColor" />
      <circle cx="15" cy="17" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function CategoryIcon({ category, ...props }: IconProps & { category: string }) {
  if (/Фото|Видео/.test(category)) {
    return (
      <svg {...defaults} {...props}>
        <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="m7 6 1.2-2h3.5l1.2 2" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (/Флорист|Декоратор/.test(category)) {
    return (
      <svg {...defaults} {...props}>
        <path d="M12 21v-8M12 15c-4.5 0-7-2.2-7-6.5 4.5 0 7 2.2 7 6.5Zm0-2.5c0-4.25 2.5-6.5 7-6.5 0 4.25-2.5 6.5-7 6.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (/бэнд|ансамбль|коллектив|Инструменталист|Шоу/.test(category)) {
    return (
      <svg {...defaults} {...props}>
        <path d="M9 18.5V6l10-2v12.5M9 8l10-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <circle cx="6.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (/зал|Ресторан|площадка|Отель/.test(category)) {
    return (
      <svg {...defaults} {...props}>
        <path d="M4 21V5.5L12 2l8 3.5V21M2.5 21h19M8 8h2M14 8h2M8 12h2M14 12h2M10 21v-5h4v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg {...defaults} {...props}>
      <path d="M8.5 11.5a4.5 4.5 0 1 1 7 0M12 14v7M9 21h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <rect x="8" y="3" width="8" height="11" rx="4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
