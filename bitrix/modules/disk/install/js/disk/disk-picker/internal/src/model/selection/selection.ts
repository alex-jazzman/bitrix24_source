import { defineStore } from 'ui.vue3.pinia';

import { type SelectionSnapshot, type SelectionState, type SelectionStateSnapshot } from './types';

// The set of files picked during one opening of the picker. Only selectable files
// reach it; folders never do. Every id carries a display snapshot taken when the
// file was picked, so the set survives a feed change and stays describable where
// none of its files are listed. The order of insertion is preserved because it
// decides the order files leave for the caller. This store never reads other
// stores and never touches the network.
export const useSelectionStore = defineStore('diskPickerSelection', {
	state: (): SelectionState => ({
		selectedIds: [],
		selectedSnapshots: {},
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
		// Snapshots in the order the files were picked: consumers describe the set
		// without reaching into the visible list.
		selectedSnapshotList(): SelectionSnapshot[]
		{
			return this.selectedIds.map((objectId) => this.selectedSnapshots[objectId]);
		},
	},
	actions: {
		has(objectId: number): boolean
		{
			return this.selectedIds.includes(objectId);
		},
		add(objectId: number, snapshot: SelectionSnapshot): void
		{
			if (!this.selectedIds.includes(objectId))
			{
				this.selectedIds = [...this.selectedIds, objectId];
				this.selectedSnapshots = { ...this.selectedSnapshots, [objectId]: snapshot };
			}
		},
		remove(objectId: number): void
		{
			this.selectedIds = this.selectedIds.filter((id) => id !== objectId);
			const selectedSnapshots = { ...this.selectedSnapshots };
			delete selectedSnapshots[objectId];
			this.selectedSnapshots = selectedSnapshots;
		},
		replaceWith(objectId: number, snapshot: SelectionSnapshot): void
		{
			this.selectedIds = [objectId];
			this.selectedSnapshots = { [objectId]: snapshot };
		},
		setActive(objectId: number | null): void
		{
			this.activeObjectId = objectId;
		},
		// The pair a double click is built on: what the set was before the first click is
		// taken whole and put back whole, so restoring costs the same whatever the click
		// did to it. The copies are detached - a snapshot survives any later change and
		// can be restored more than once.
		captureState(): SelectionStateSnapshot
		{
			return {
				selectedIds: [...this.selectedIds],
				selectedSnapshots: { ...this.selectedSnapshots },
				activeObjectId: this.activeObjectId,
			};
		},
		restoreState(snapshot: SelectionStateSnapshot): void
		{
			this.selectedIds = [...snapshot.selectedIds];
			this.selectedSnapshots = { ...snapshot.selectedSnapshots };
			this.activeObjectId = snapshot.activeObjectId;
		},
		// Only an explicit reset and closing the picker empty the set.
		clear(): void
		{
			this.selectedIds = [];
			this.selectedSnapshots = {};
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
