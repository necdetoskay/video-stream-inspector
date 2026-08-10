export type SafeEvent = {
  event: "inspection.completed" | "acquisition.allowed" | "acquisition.denied" | "acquisition.completed" | "acquisition.failed";
  timestamp: string;
  outcome?: "allow" | "deny" | "success" | "failure";
  decisionCode?: string;
  mediaKind?: "direct" | "hls" | "dash";
  candidateCount?: number;
  bytes?: number;
  mimeType?: string;
};

export type EventSink = (event: SafeEvent) => void;

export function emitSafeEvent(sink: EventSink, event: Omit<SafeEvent, "timestamp"> & { timestamp?: string }): SafeEvent {
  const safe: SafeEvent = Object.freeze({
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  });
  sink(safe);
  return safe;
}

export function jsonConsoleSink(event: SafeEvent): void {
  console.info(JSON.stringify(event));
}
