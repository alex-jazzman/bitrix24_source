// The creation screen keeps the hero in edit mode, but not while the save is in flight: the payload
// has already left, so a name typed then would be dropped by the navigation that follows.
export function isCreationEditPinned(creationMode: boolean, readOnly: boolean): boolean
{
	return creationMode && !readOnly;
}
