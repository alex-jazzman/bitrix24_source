// Everything the picker shows about a picked file, copied from the feed item at the
// moment of picking. The snapshot is never rebuilt, so a picked file stays displayable
// in a feed where it is not listed.
export type SelectionSnapshot = {
	objectId: number,
	size: number | null,
	iconType: string,
	previewUrl: string | null,
	createTime: number | null,
	updateTime: number | null,
};

// A detached copy of the whole selection taken at one moment: the ids in their order,
// the display snapshot of each of them and the active object. Unlike SelectionSnapshot,
// which describes one picked file, this one describes the set itself and exists to put
// it back exactly as it was.
export type SelectionStateSnapshot = {
	selectedIds: number[],
	selectedSnapshots: { [objectId: number]: SelectionSnapshot },
	activeObjectId: number | null,
};

// Selection is an ordered set of picked object ids with a display snapshot for each
// of them plus the active object shown in the preview panel. The active object and
// selection are distinct: an id may be active without staying selected, and a
// selected id may be absent from the current feed while still counting.
export type SelectionState = {
	selectedIds: number[],
	selectedSnapshots: { [objectId: number]: SelectionSnapshot },
	activeObjectId: number | null,
};
