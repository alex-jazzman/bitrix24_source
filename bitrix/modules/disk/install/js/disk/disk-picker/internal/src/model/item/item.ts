import { defineStore } from 'ui.vue3.pinia';

import { type PickerItem } from './types';

// Normalized list of the current feed's output items. No network here - the
// feature layer feeds already-mapped DTO-05 items. `recentSnapshot` keeps the
// full bounded recent list (server-allowed types already applied) so user
// filters can narrow it locally without a new request.
export const useItemStore = defineStore('diskPickerItem', {
	state: (): { items: PickerItem[], recentSnapshot: PickerItem[] } => ({
		items: [],
		recentSnapshot: [],
	}),
	getters: {
		count(): number
		{
			return this.items.length;
		},
		// O(1) lookup by object id, recomputed only when the feed changes; keeps the
		// preview panel's selectedItems resolution linear instead of O(selected x items).
		byId(): Map<number, PickerItem>
		{
			return new Map(this.items.map((item) => [item.objectId, item]));
		},
	},
	actions: {
		getById(objectId: number): PickerItem | null
		{
			return this.byId.get(objectId) ?? null;
		},
		replace(items: PickerItem[]): void
		{
			this.items = [...items];
		},
		setRecentSnapshot(items: PickerItem[]): void
		{
			this.recentSnapshot = [...items];
		},
		// Cross-page merge by objectId: an item already present keeps its
		// position and gets its fields refreshed from the newer DTO; a genuinely
		// new item is appended. Returns the count of newly appended rows.
		append(items: PickerItem[]): number
		{
			const indexByObjectId = new Map(this.items.map((item, index) => [item.objectId, index]));
			const next = [...this.items];
			let added = 0;

			items.forEach((item) => {
				const position = indexByObjectId.get(item.objectId);
				if (position === undefined)
				{
					indexByObjectId.set(item.objectId, next.length);
					next.push(item);
					added += 1;
				}
				else
				{
					next[position] = item;
				}
			});

			this.items = next;

			return added;
		},
		clear(): void
		{
			this.items = [];
			this.recentSnapshot = [];
		},
	},
});
