import type { YandexIntegrationModel } from './types';

export function getEmptyIntegration(): YandexIntegrationModel
{
	return {
		status: null,
		catalogPermissions: null,
		isResourceSkuRelationsSaved: false,
		resources: [],
		cabinetLink: '',
		timezone: '',
		settings: {
			businessLink: '',
			cabinetLinkPlaceholder: '',
		},
	};
}
