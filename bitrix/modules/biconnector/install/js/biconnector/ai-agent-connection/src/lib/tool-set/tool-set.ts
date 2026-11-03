import { Loc, Type } from 'main.core';

import { TOOL_SET_TITLE_KEY } from '../../const/connection';

/**
 * The name of the set of operations as the popup says it. A code the table does not know and a phrase the
 * page did not load answer the same way - with nothing: the group then stands without a caption, and every
 * record of it stands in the list all the same.
 */
export const getToolSetTitle = (toolSetCode: string): string | null => {
	const key = TOOL_SET_TITLE_KEY[toolSetCode] ?? null;
	if (key === null)
	{
		return null;
	}

	const title = Loc.getMessage(key);

	return Type.isStringFilled(title) ? title : null;
};
