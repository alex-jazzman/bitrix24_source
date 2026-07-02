export function resolveHeadingLevel(editor: Object | null): number
{
	if (!editor)
	{
		return 0;
	}

	for (const level of [1, 2, 3, 4])
	{
		if (editor.isActive('heading', { level }))
		{
			return level;
		}
	}

	return 0;
}

export function resolveCanUndo(editor: Object | null): boolean
{
	return Boolean(editor?.can?.().undo?.());
}

export function resolveCanRedo(editor: Object | null): boolean
{
	return Boolean(editor?.can?.().redo?.());
}
