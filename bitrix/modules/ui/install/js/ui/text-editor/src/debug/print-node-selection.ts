import { $isNodeSelection, type BaseSelection } from 'ui.lexical.core';

export function printNodeSelection(selection: BaseSelection): string
{
	if (!$isNodeSelection(selection))
	{
		return '';
	}

	const nodeKeys: string[] = selection.getNodes().map((node) => node.getKey());

	return `: node\n  └ [${nodeKeys.join(', ')}]`;
}
