import type { ResourceModel } from 'booking.model.resources';

export type { ResourceModel };

export type ResourceId = number | null;

export type ResourceCreationWizardState = {
	resourceId: ResourceId;
	resourceName: string;
	resourceAvatarFile: File | null;
	resource: ResourceModel;
	advertisingResourceTypes: AdvertisingResourceType[],
	favorite: boolean;
	fetching: boolean,
	step: number;
	globalSchedule: boolean;
	slotLengthId: SlotLengthId;
	isSaving: boolean;
	isCompanyScheduleAccess: boolean;
	companyScheduleUrl: string;
	invalidResourceName: boolean;
	invalidResourceType: boolean;
	invalidIntegrationCalendarUser: boolean;
	weekStart: string;
	isChannelChoiceAvailable: boolean;
	isIntegrationCalendarEnabled: boolean;
	checkedForAll: { [type: string]: boolean };
	catalogSkuEntityOptions: CatalogSkuEntityOptions;
	showLicenseWarning: boolean;
}

export type InitPayload = {
	resourceId: ResourceId,
	resource: ResourceModel,
	step: number;
	favorite?: boolean;
}

export type ResourceCreationType = {
	code: string;
	name: string;
	icon: string;
	description?: string;
	relatedResourceTypeId: number,
	value: number;
}

export type AdvertisingResourceType = {
	code: string;
	name: string;
	description: string;
	relatedResourceTypeId: number;
}

export type SlotLengthId = 0 | 60 | 120 | 1440 | 10080;

export type CatalogSkuEntityOptions = {
	basePriceId: number;
	iblockId: number;
	restrictedProductTypes: number[];
	showPriceInCaption: boolean;
	canCreate: boolean;
}
