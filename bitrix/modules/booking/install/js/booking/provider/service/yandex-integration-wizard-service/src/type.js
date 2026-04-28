import { IntegrationMapItemStatus } from 'booking.const';
import type {
	CatalogPermissions,
	YandexIntegrationSettings,
} from 'booking.model.yandex-integration-wizard';
import type { ResourceDto } from 'booking.provider.service.resources-service';

export type GetYandexIntegrationDto = {
	status: $Values<typeof IntegrationMapItemStatus> | null,
	catalogPermissions: CatalogPermissions,
	isResourceSkuRelationsSaved: boolean,
	resources: ResourceDto[],
	cabinetLink: string,
	timezone: string,
	settings: YandexIntegrationSettings,
};

export type UpdateYandexIntegrationDto = {
	resources: ResourceDto[],
	cabinetLink: string,
	cabinetId: string,
	timezone: string,
};
