import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { resourceDialogService } from 'booking.provider.service.resource-dialog-service';
import type { ResourceModel } from 'booking.model.resources';

export async function fetchMainResources(): Promise<ResourceModel[]>
{
	await resourceDialogService.getMainResources();

	return (Core.getStore().getters[`${Model.Resources}/get`] || []).map((resource) => {
		return {
			...resource,
			skus: [],
			skusYandex: [],
		};
	});
}
