import type {
  MatchResponse,
  SseEventType,
} from "../../../../shared/contract";

export type RunStatus =
  | "idle"
  | "connecting"
  | "running"
  | "done"
  | "cancelled"
  | "error";

export type TimelineItem = {
  id: number;
  type: SseEventType;
  title: string;
  detail: string;
  time: string;
};

export type DateComparison = {
  firstDate: string;
  first: MatchResponse;
  secondDate: string;
  second: MatchResponse;
};
