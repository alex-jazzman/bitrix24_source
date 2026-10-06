import { NotificationTemplateType } from 'booking.const';
import { Duration } from 'booking.lib.duration';
import { type TemplateTypePreselectionContext } from 'booking.model.resource-creation-wizard';

const unitDurations = Duration.getUnitDurations();

export const SlotLengthLimitWithoutMultiday = (unitDurations.H * 12) / unitDurations.i;
export const MultidaySlotThresholdMinutes = (unitDurations.H * 24) / unitDurations.i;

export type TemplateTypeSelection = {
	templateTypeInfo: string,
	templateTypeConfirmation: string,
};

export type MultidayTemplateAvailability = {
	templateTypeInfo: boolean,
	templateTypeConfirmation: boolean,
};

type NotificationTemplate = {
	type: string,
};

export function normalizeSlotLength(slotLength: number, isMultidayFeatureEnabled: boolean): number
{
	if (isMultidayFeatureEnabled || slotLength <= SlotLengthLimitWithoutMultiday)
	{
		return slotLength;
	}

	return SlotLengthLimitWithoutMultiday;
}

export function shouldPreselectTemplateTypes(
	isEditForm: boolean,
	previousContext: ?TemplateTypePreselectionContext,
	currentContext: TemplateTypePreselectionContext,
): boolean
{
	return !isEditForm && (
		!previousContext
		|| previousContext.resourceTypeId !== currentContext.resourceTypeId
		|| previousContext.slotLength !== currentContext.slotLength
	);
}

export function resolvePreselectedTemplateTypes(
	slotLength: number,
	resourceTypeDefaults: TemplateTypeSelection,
	multidayTemplateAvailability: MultidayTemplateAvailability,
): TemplateTypeSelection
{
	return {
		templateTypeInfo: resolvePreselectedTemplateType(
			slotLength,
			resourceTypeDefaults.templateTypeInfo,
			multidayTemplateAvailability.templateTypeInfo,
		),
		templateTypeConfirmation: resolvePreselectedTemplateType(
			slotLength,
			resourceTypeDefaults.templateTypeConfirmation,
			multidayTemplateAvailability.templateTypeConfirmation,
		),
	};
}

export function isMultidayTemplateAvailable(templates?: NotificationTemplate[]): boolean
{
	return (templates ?? []).some(({ type }) => type === NotificationTemplateType.InanimateLong);
}

function resolvePreselectedTemplateType(
	slotLength: number,
	defaultTemplateType: string,
	isAvailable: boolean,
): string
{
	if (slotLength >= MultidaySlotThresholdMinutes && isAvailable)
	{
		return NotificationTemplateType.InanimateLong;
	}

	return defaultTemplateType === NotificationTemplateType.InanimateLong
		? NotificationTemplateType.Inanimate
		: defaultTemplateType
	;
}
