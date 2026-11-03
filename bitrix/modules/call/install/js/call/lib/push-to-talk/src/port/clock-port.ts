export type TimerId = number;

export interface ClockPort {
	now(): number;
	after(ms: number, callback: () => void): TimerId;
	cancel(id: TimerId): void;
}
