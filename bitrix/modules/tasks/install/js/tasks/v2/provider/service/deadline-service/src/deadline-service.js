import type { Store } from 'ui.vue3.vuex';

import { Model, Endpoint } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';

export class DeadlineService
{
	async updateDeadlineChangeCount(taskId: number): Promise<void>
	{
		const deadlineChangeCount = await apiClient.post(
			Endpoint.TaskDeadlineGetDeadlineChangeCount,
			{ taskId },
		);

		void this.$store.dispatch(`${Model.Interface}/updateDeadlineChangeCount`, deadlineChangeCount);
	}

	cleanChangeLog(taskId: number): void
	{
		apiClient.post(Endpoint.TaskDeadlineCleanChangeLog, { taskId });

		void this.$store.dispatch(`${Model.Interface}/updateDeadlineChangeCount`, 0);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const deadlineService = new DeadlineService();
