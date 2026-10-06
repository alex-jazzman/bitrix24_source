// Selection is an ordered set of chosen object ids and their size snapshots plus
// the active object shown in the preview panel. The active object and selection
// are distinct: an id may be active without staying selected, and a selected id
// may be temporarily hidden by search or filtering while still counting.
export type SelectionState = {
	selectedIds: number[],
	selectedSizes: { [objectId: number]: number },
	activeObjectId: number | null,
};
