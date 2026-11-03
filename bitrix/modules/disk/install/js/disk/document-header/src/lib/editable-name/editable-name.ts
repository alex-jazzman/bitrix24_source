/**
 * The extension belongs to the object, not to the name a person edits: the header shows and the field
 * carries the name without it, while the model and the server keep the name with it. Both sides of
 * that rule live here alone - split between the header and the rename, it let the extension be
 * appended twice.
 */

/** The name as the header shows it and the field opens with. */
export function toEditableName(storedName: string, extension: string): string
{
	const suffix = `.${extension}`;

	return extension !== '' && storedName.endsWith(suffix)
		? storedName.slice(0, -suffix.length)
		: storedName
	;
}

/** The name as the model keeps it. An object without an extension stores the edited name as it is. */
export function toStoredName(editedName: string, extension: string): string
{
	return editedName === '' || extension === ''
		? editedName
		: `${editedName}.${extension}`
	;
}
