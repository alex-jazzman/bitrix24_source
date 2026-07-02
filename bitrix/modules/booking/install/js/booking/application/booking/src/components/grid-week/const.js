import { Duration } from 'booking.lib.duration';

export const MinVisibleBookingDurationMs = Duration.getUnitDurations().H / 2;

export const MinCreatedBookingDurationMs = Duration.getUnitDurations().H * 12;
export const MinCellStatsSlotSizeMinutes = MinCreatedBookingDurationMs / Duration.getUnitDurations().i;

export const MaxDurationMsCompactCell = 18 * Duration.getUnitDurations().H;
