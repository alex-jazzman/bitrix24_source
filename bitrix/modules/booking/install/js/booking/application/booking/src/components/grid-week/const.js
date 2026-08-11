import { Duration } from 'booking.lib.duration';

export const MinAvailableZoom = 1;

export const InsufficientZoomMinVisibleDurationMs = Duration.getUnitDurations().H / 2;
export const InsufficientZoomThreshold = 2;

export const MinCreatedBookingDurationMs = Duration.getUnitDurations().H * 12;
export const MinCellStatsSlotSizeMinutes = MinCreatedBookingDurationMs / Duration.getUnitDurations().i;

export const MaxDurationMsCompactCell = 18 * Duration.getUnitDurations().H;

export const MaxOverflowPx = 35;
export const MinSlotWidthPx = 78;
