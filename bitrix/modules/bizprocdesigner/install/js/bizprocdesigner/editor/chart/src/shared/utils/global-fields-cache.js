import { Cache, Type } from 'main.core';
import { shallowReactive } from 'ui.vue3';

import { editorAPI } from '../api';

// One record of the answer of `bizproc.globalfield.reload` (API-02): the list is a map of the id of a
// global value to its property, and that id is exactly what a reference names: `{=GlobalVar:<id>}`.
export type GlobalField = {
	Name: string,
	Type: string,
	VisibilityName?: string,
};

// A catalog as it is kept: the records as the action answered them, and the reverse index of the full
// signature of a value to its id, built once per answer instead of per reference read.
type GlobalFieldsCatalog = {
	fields: { [string]: GlobalField },
	idsByCaption: Map<string, string>,
};

export const GLOBAL_FIELD_MODES = Object.freeze({
	VARIABLE: 'variable',
	CONSTANT: 'constant',
});

const VISIBILITY_SEPARATOR = ': ';

function indexByCaption(fields: { [string]: GlobalField }): Map<string, string>
{
	const index = new Map();

	for (const [id, field] of Object.entries(fields))
	{
		if (Type.isStringFilled(field?.VisibilityName) && Type.isStringFilled(field?.Name))
		{
			const caption = `${field.VisibilityName}${VISIBILITY_SEPARATOR}${field.Name.trim()}`;
			if (!index.has(caption))
			{
				index.set(caption, id);
			}
		}
	}

	return index;
}

// Reactive for the reason documentFieldsCache is reactive: the names are read synchronously, from
// inside the render of the tokens of a readable expression. Shallow: a Map of Vue tracks reads per key
// and the records themselves stay raw.
const cache: Map<string, GlobalFieldsCatalog> = shallowReactive(new Map());
const pendingRequests = new Cache.MemoryCache();
const failedRequests: Set<string> = new Set();

function cacheKey(mode: string, documentTypeSigned: string): string
{
	return `${mode}:${documentTypeSigned}`;
}

/**
 * Global variables and constants of the portal. No page carries them, so the first reference of a text
 * asks for them and the reader redraws its caption once they land - nothing is requested while no text
 * names a global value.
 *
 * An empty list is a settled answer, not a failure: that is what a portal without global values answers,
 * and what a refusal by read rights answers as well (API-02). Neither is told to the user - the token
 * keeps the caption of its source and the code of the value, as it did before the list existed.
 *
 * A request that broke is settled until the next user edit: an automatic redraw must not turn a transport
 * failure into an endless request loop, while a later blur may retry without reloading the page.
 */
export const globalFieldsCache = {
	has(mode: string, documentTypeSigned: string): boolean
	{
		const key = cacheKey(mode, documentTypeSigned);

		return cache.has(key) || failedRequests.has(key);
	},

	retryFailed(): void
	{
		failedRequests.clear();
	},

	find(mode: string, documentTypeSigned: string, fieldId: string): GlobalField | null
	{
		return cache.get(cacheKey(mode, documentTypeSigned))?.fields?.[fieldId] ?? null;
	},

	/**
	 * The id of the value a `{{...}}` of the automation designer names by its caption. A caption of a
	 * global value is its full signature `<visibility>: <name>` ({@see
	 * \Bitrix\Bizproc\Automation\Helper::getGlobalsMap}), and the server reads it back by that whole
	 * signature ({@see \Bitrix\Bizproc\Automation\Helper::unConvertExpressions}) - two values of one
	 * name in different visibilities are told apart by it. A record the action answered without the name
	 * of its visibility stays out of the index: half a signature must not match a caption.
	 *
	 * Two values of one signature are not forbidden by the storage, and the server takes the first of
	 * them (`array_search` over the map of the captions), so the index keeps the first as well - the
	 * caption must name the value the server names by it.
	 */
	findIdByCaption(mode: string, documentTypeSigned: string, caption: string): string | null
	{
		return cache.get(cacheKey(mode, documentTypeSigned))?.idsByCaption?.get(caption) ?? null;
	},

	// One request per pair of the mode and the type of the document, shared by every consumer: the
	// fields of one form are resolved in one pass, and each of them must not bring a request of its own.
	load(mode: string, documentTypeSigned: string): Promise<{ [string]: GlobalField }>
	{
		const key = cacheKey(mode, documentTypeSigned);
		if (cache.has(key))
		{
			return Promise.resolve(cache.get(key).fields);
		}
		if (failedRequests.has(key))
		{
			return Promise.resolve({});
		}

		return pendingRequests.remember(key, async () => {
			try
			{
				const fields = await editorAPI.fetchGlobalFields(mode, documentTypeSigned);
				failedRequests.delete(key);
				cache.set(key, { fields, idsByCaption: indexByCaption(fields) });

				return fields;
			}
			catch (error)
			{
				failedRequests.add(key);
				console.error('globalFieldsCache: failed to fetch global fields', error);

				return {};
			}
			finally
			{
				pendingRequests.delete(key);
			}
		});
	},
};
