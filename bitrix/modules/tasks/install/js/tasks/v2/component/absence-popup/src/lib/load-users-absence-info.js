import type { UserDialogItem } from 'tasks.v2.lib.user-selector-dialog';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { absenceService } from 'tasks.v2.provider.service.absence-service';

export async function loadUsersAbsenceInfo(items: UserDialogItem[] = []): Promise<number[]>
{
	const $store = Core.getStore();

	const currentUserId: number = $store.getters[`${Model.Interface}/currentUserId`];
	const userIds = items
		.filter((item) => item.customData.get('isOnVacation') && item.getId() !== currentUserId)
		.map((item) => item.getId());

	if (userIds.length > 0)
	{
		await $store.dispatch(`${Model.Absences}/setFetching`, true);
		await absenceService.getUsersAbsenceInfo(userIds);
		await $store.dispatch(`${Model.Absences}/setFetching`, false);
	}

	return userIds;
}
