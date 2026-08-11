import { Duration } from 'booking.lib.duration';

const unitDurations = Duration.getUnitDurations();

export const SlotLengthLimitWithoutMultiday = (unitDurations.H * 12) / unitDurations.i;

export function normalizeSlotLength(slotLength: number, isMultidayFeatureEnabled: boolean): number
{
	if (isMultidayFeatureEnabled || slotLength <= SlotLengthLimitWithoutMultiday)
	{
		return slotLength;
	}

	return SlotLengthLimitWithoutMultiday;
}
