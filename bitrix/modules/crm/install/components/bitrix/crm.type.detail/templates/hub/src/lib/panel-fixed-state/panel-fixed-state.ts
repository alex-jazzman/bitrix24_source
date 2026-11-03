// The creation preview hides the global save panel altogether (the hero carries its own Save), so a
// fixed panel there would be an empty white strip with a border pinned over the content as soon as
// the title is typed and isDirty flips. The parameter is optional and defaults to "not the preview"
// so every call site that knows nothing about the mode keeps today's isDirty || !isNew behaviour.
export function isTypeHubPanelFixed(isDirty: boolean, isNew: boolean, isCreationPreview: boolean = false): boolean
{
	if (isCreationPreview)
	{
		return false;
	}

	return isDirty || !isNew;
}
