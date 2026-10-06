import { defineStore } from 'ui.vue3.pinia';
import { Type, Text } from 'main.core';
import { UI } from 'ui.notification';

import { isTemplateId } from '../../../shared/utils';
import { dataViewApi } from '../api';

export type DataViewItem = {
	id: number,
	storageTypeId: number,
	title: string,
	description: string,
	status: string,
	rowsCount: number,
};

type NodeDataViewsState = {
	items: Array<DataViewItem>,
	isLoading: boolean,
	loadedKey: string | null,
	lastFetchId: number,
};

export function buildNodeKey(templateId: number, activityName: string): string
{
	return `${templateId}:${activityName}`;
}

function notifyError(error: Error): void
{
	UI.Notification.Center.notify({
		content: Text.encode(error?.message ?? ''),
		autoHideDelay: 4000,
	});
}

export const useNodeDataViewsStore = defineStore('bizprocdesigner-editor-node-data-views', {
	state: (): NodeDataViewsState => ({
		items: [],
		isLoading: false,
		loadedKey: null,
		lastFetchId: 0,
	}),
	getters:
	{
		hasItems: (state: NodeDataViewsState): boolean => state.items.length > 0,
	},
	actions:
	{
		async load(templateId: number, activityName: string): Promise<void>
		{
			if (!isTemplateId(templateId) || !Type.isStringFilled(activityName))
			{
				return;
			}

			if (this.loadedKey === buildNodeKey(templateId, activityName))
			{
				return;
			}

			const fetchId = ++this.lastFetchId;
			this.isLoading = true;
			try
			{
				const data = await dataViewApi.list(templateId, activityName);
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.items = Type.isArray(data?.items) ? data.items : [];
				this.loadedKey = buildNodeKey(templateId, activityName);
			}
			catch (error)
			{
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.items = [];
				this.loadedKey = null;
				notifyError(error);
			}
			finally
			{
				if (this.lastFetchId === fetchId)
				{
					this.isLoading = false;
				}
			}
		},
		async remove(storageTypeId: number): Promise<boolean>
		{
			try
			{
				await dataViewApi.remove(storageTypeId);
				this.items = this.items.filter((item) => item.storageTypeId !== storageTypeId);

				return true;
			}
			catch (error)
			{
				notifyError(error);

				return false;
			}
		},
		/**
		 * Adds or updates a view of the current node. Passing the node key marks the list as loaded for
		 * that node, so a view saved after the initial list load failed (loadedKey still null) becomes
		 * visible at once instead of hiding behind the load gate until the node is reopened.
		 */
		upsert(item: DataViewItem, nodeKey: ?string): void
		{
			if (!item || !Type.isNumber(item.storageTypeId))
			{
				return;
			}

			if (Type.isStringFilled(nodeKey))
			{
				this.loadedKey = nodeKey;
			}

			const index = this.items.findIndex((current) => current.storageTypeId === item.storageTypeId);
			if (index === -1)
			{
				this.items.push(item);

				return;
			}

			this.items.splice(index, 1, { ...this.items[index], ...item });
		},
		reset(): void
		{
			this.items = [];
			this.isLoading = false;
			this.loadedKey = null;
			this.lastFetchId = 0;
		},
	},
});
