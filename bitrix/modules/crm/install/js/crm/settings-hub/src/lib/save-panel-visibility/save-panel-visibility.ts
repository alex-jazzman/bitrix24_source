// The save panel is only a save trigger: it shows once the form is dirty and stays hidden in
// read-only mode regardless of dirtiness.
export function isSavePanelVisible(isDirty: boolean, readOnly: boolean): boolean
{
	return !readOnly && isDirty;
}
