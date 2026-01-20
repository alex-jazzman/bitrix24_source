import { YandexIntegrationModel } from 'booking.model.yandex-integration-wizard';
import { YandexCabinetIdExtractor } from './internal/cabinet-id-extractor';

import type { ResourceModel } from 'booking.model.resources';
import type { ResourceDto } from 'booking.provider.service.resources-service';
import type { GetYandexIntegrationDto, UpdateYandexIntegrationDto } from './type';

import { ResourceMappers } from 'booking.provider.service.resources-service';

export function mapDtoToModel(dto: GetYandexIntegrationDto): YandexIntegrationModel
{
	const resources: ResourceModel[] = dto.resources.map(
		(resourceDto: ResourceDto): ResourceModel => ResourceMappers.mapDtoToModel(resourceDto),
	);

	return {
		status: dto.status,
		catalogPermissions: dto.catalogPermissions,
		catalogSkuEntityOptions: dto.catalogSkuEntityOptions,
		isResourceSkuRelationsSaved: dto.isResourceSkuRelationsSaved,
		resources,
		cabinetLink: dto.cabinetLink,
		timezone: dto.timezone,
		settings: dto.settings,
	};
}

export async function mapModelToDto(model: YandexIntegrationModel): UpdateYandexIntegrationDto
{
	const resources: ResourceDto[] = [];

	for await (const resourceModel of model.resources)
	{
		resources.push(await ResourceMappers.mapModelToDto(resourceModel));
	}

	return {
		resources,
		cabinetLink: model.cabinetLink,
		cabinetId: YandexCabinetIdExtractor.extractFromCabinetLink(model.cabinetLink),
		timezone: model.timezone,
	};
}
