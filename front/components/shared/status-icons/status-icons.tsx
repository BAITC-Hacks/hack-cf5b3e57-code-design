import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  "aria-hidden": true,
  fill: "none",
  viewBox: "0 0 24 24",
} as const;

export function CheckStatusIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="m5 12.5 4.3 4.3L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ClaimedStatusIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="M6.5 8h4v4c0 2.3-1.25 3.65-3.75 4M13.5 8h4v4c0 2.3-1.25 3.65-3.75 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="M14 5h5v5M19 5l-8 8M18 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
