import { getSchema } from '@tiptap/core';
import { createEditorExtensions } from '../extensions/registry';

let cachedSchema = null;

export function getEditorSchema(): Object
{
	if (!cachedSchema)
	{
		const extensions = createEditorExtensions({});
		cachedSchema = getSchema(extensions);
	}

	return cachedSchema;
}
