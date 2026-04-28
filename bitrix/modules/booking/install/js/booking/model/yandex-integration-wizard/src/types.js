import { IntegrationMapItemStatus } from 'booking.const';
import { ResourceModel } from 'booking.model.resources';

export type YandexIntegrationWizardState = {
	integration: YandexIntegrationModel,
	resources: ResourceModel[],
	cabinetLink: string,
	timezone: string,

	hasInvalidCabinetLink: boolean;
	hasInvalidResources: boolean;

	wasTimezoneChanged: boolean,
	wasResourcesChanged: boolean,
	wasCabinetLinkChanged: boolean,

	isFetching: boolean;
	isLoaded: boolean;
}

export type YandexIntegrationModel = {
	status: $Values<typeof IntegrationMapItemStatus> | null,
	catalogPermissions: CatalogPermissions | null,
	isResourceSkuRelationsSaved: boolean,
	resources: ResourceModel[],
	cabinetLink: string,
	timezone: string,
	settings: YandexIntegrationSettings,
}

export type CatalogPermissions = {
	read: boolean;
}

export type setCabinetLinkPayload = {
	link: string;
	skipCalculateChanges?: boolean;
}

export type setResourcesPayload = {
	resources: ResourceModel[];
	skipCalculateChanges?: boolean;
}

export type setTimezonePayload = {
	timezone: string;
	skipCalculateChanges?: boolean;
}

export type YandexIntegrationSettings = {
	businessLink: string;
	cabinetLinkPlaceholder: string;
}
