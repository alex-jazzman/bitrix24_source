import { apiClient } from 'tasks.v2.lib.api-client';

import { type CheckListCompletionSourceItem } from '../../../types';

// plain action name: this extension must stay free of tasks.v2.const (Endpoint dictionary)
const CheckListGetAction = 'CheckList.get';

export class CheckListSnapshotService
{
	async getItems(taskId: number): Promise<CheckListCompletionSourceItem[]>
	{
		const response = await apiClient.post(CheckListGetAction, { taskId });

		return Array.isArray(response) ? response : (response?.checklist ?? []);
	}
}

export const checkListSnapshotService = new CheckListSnapshotService();
