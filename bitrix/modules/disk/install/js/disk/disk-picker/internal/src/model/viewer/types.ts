// One preview session: which file is being opened or shown. Neither the element the
// preview was started from nor whose Escape press the viewer took is part of it: the
// first belongs to the feature layer, the second to the document listeners of the
// picker window, which is where each of them is kept.
export type ViewerState = {
	openingObjectId: number | null,
	open: boolean,
};
