import { Type } from 'main.core';
import * as Y from 'yjs';
import { prosemirrorJSONToYDoc } from '@tiptap/y-tiptap';
import { createEmptyDocument } from '../feature/create-document-state';
import { base64ToUint8Array } from '../utils/binary';

function normalizeMarkdown(markdown: mixed): Object
{
	if (Type.isPlainObject(markdown) && markdown.type === 'doc')
	{
		return markdown;
	}

	if (Type.isStringFilled(markdown))
	{
		try
		{
			const parsed = JSON.parse(markdown);
			if (Type.isPlainObject(parsed) && parsed.type === 'doc')
			{
				return parsed;
			}
		}
		catch
		{
			// fall through
		}
	}

	return createEmptyDocument();
}

export function createYDoc({
	yjsState,
	markdown,
	patches,
	schema,
}: {
	yjsState: string | null,
	markdown: mixed,
	patches: Array<Object>,
	schema: Object,
}): Object
{
	let doc = null;

	if (Type.isStringFilled(yjsState))
	{
		doc = new Y.Doc();
		Y.applyUpdate(doc, base64ToUint8Array(yjsState));
	}
	else
	{
		const json = normalizeMarkdown(markdown);
		doc = prosemirrorJSONToYDoc(schema, json, 'prosemirror');
	}

	if (patches.length > 0)
	{
		const binaryPatches = patches
			.map((p) => base64ToUint8Array(String(p.PATCH || p.patch || '')))
			.filter((bytes) => bytes.length > 0);

		if (binaryPatches.length > 0)
		{
			const merged = Y.mergeUpdates(binaryPatches);
			Y.applyUpdate(doc, merged, 'remote');
		}
	}

	return doc;
}
