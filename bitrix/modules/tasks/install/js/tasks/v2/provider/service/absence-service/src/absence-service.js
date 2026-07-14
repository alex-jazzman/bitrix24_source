import { Store } from 'ui.vue3.vuex';

import { Endpoint, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import type { UserAbsence } from 'tasks.v2.model.absences';

import { mapDtoToModel } from './mappers';

export class AbsenceService
{
	async getUsersAbsenceInfo(userIds: number[]): Promise<void>
	{
		try
		{
			const requestedUserIds = this.#filterExistingUserAbsences(userIds);
			if (requestedUserIds.length === 0)
			{
				return;
			}

			const userAbsences = await this.#requestAbsences(requestedUserIds);

			await this.$store.dispatch(`${Model.Absences}/upsertMany`, userAbsences);
		}
		catch (error)
		{
			console.error('Task.AbsenceService. Get user absence info error', error);
		}
	}

	async #requestAbsences(userIds: number[]): UserAbsence
	{
		const absenceDtoCollection = await apiClient.post(Endpoint.AbsenceGet, { userIds });

		return absenceDtoCollection.map((dto) => mapDtoToModel(dto));
	}

	#filterExistingUserAbsences(userIds: number[]): number[]
	{
		const existingUserIds = new Set(
			this.$store.getters[`${Model.Absences}/getAll`].map(({ userId }) => userId),
		);

		return userIds.filter((userId) => !existingUserIds.has(userId));
	}

	async setViewed(absenceId: number, userId: number): Promise<void>
	{
		try
		{
			await apiClient.post(Endpoint.AbsenceView, { absenceId, userId });
			await this.$store.dispatch(`${Model.Absences}/update`, {
				id: absenceId,
				fields: {
					viewed: true,
				},
			});
		}
		catch (error)
		{
			console.error('Task.AbsenceService. Set viewed error', error);
		}
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const absenceService = new AbsenceService();
