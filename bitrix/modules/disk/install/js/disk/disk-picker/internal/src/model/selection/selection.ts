import { defineStore } from 'ui.vue3.pinia';

import { type SelectionState } from './types';

// Selection of the current feed. Only selectable files reach it; folders never
// do. File sizes are snapshotted so hidden selections remain in the total. The
// order of insertion is preserved because it decides the order files leave for
// the caller. This store never reads other stores and never touches the network.
export const useSelectionStore = defineStore('diskPickerSelection', {
	state: (): SelectionState => ({
		selectedIds: [],
		selectedSizes: {},
		activeObjectId: null,
	}),
	getters: {
		count(): number
		{
			return this.selectedIds.length;
		},
		canConfirm(): boolean
		{
			return this.selectedIds.length > 0;
		},
		// O(1) membership for the per-row `isSelected` check during a full list re-render;
		// recomputed only when the selection changes.
		selectedIdSet(): Set<number>
		{
			return new Set(this.selectedIds);
		},
	},
	actions: {
		has(objectId: number): boolean
		{
			return this.selectedIds.includes(objectId);
		},
		add(objectId: number, size?: number): void
		{
			if (!this.selectedIds.includes(objectId))
			{
				this.selectedIds = [...this.selectedIds, objectId];
				if (size !== undefined)
				{
					this.selectedSizes = { ...this.selectedSizes, [objectId]: size };
				}
			}
		},
		remove(objectId: number): void
		{
			this.selectedIds = this.selectedIds.filter((id) => id !== objectId);
			const selectedSizes = { ...this.selectedSizes };
			delete selectedSizes[objectId];
			this.selectedSizes = selectedSizes;
		},
		replaceWith(objectId: number, size?: number): void
		{
			this.selectedIds = [objectId];
			this.selectedSizes = size === undefined ? {} : { [objectId]: size };
		},
		setActive(objectId: number | null): void
		{
			this.activeObjectId = objectId;
		},
		// Changing the feed drops selection and active alike.
		clear(): void
		{
			this.selectedIds = [];
			this.selectedSizes = {};
			this.activeObjectId = null;
		},
		// The active preview must stay within the visible list. Selection is kept
		// independently and is never pruned: a hidden selected id still counts and
		// is re-marked when it reappears, but a hidden active preview is dropped for
		// good and is not restored when the object comes back.
		pruneActive(visibleObjectIds: number[]): void
		{
			if (this.activeObjectId !== null && !visibleObjectIds.includes(this.activeObjectId))
			{
				this.activeObjectId = null;
			}
		},
	},
});
