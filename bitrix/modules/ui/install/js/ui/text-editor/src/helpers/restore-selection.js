import {
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	$setSelection,
	type RangeSelection,
} from 'ui.lexical.core';

export function $restoreSelection(lastSelection: RangeSelection): boolean
{
	const selection = $getSelection();
	if (!$isRangeSelection(selection) && lastSelection !== null)
	{
		const isSelectionAlive = (
			$getNodeByKey(lastSelection.anchor.key) !== null && $getNodeByKey(lastSelection.focus.key) !== null
		);

		if (isSelectionAlive)
		{
			$setSelection(lastSelection);

			return true;
		}

		return false;
	}

	return false;
}
