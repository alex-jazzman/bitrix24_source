import { Cache, Type } from 'main.core';
import { shallowReactive } from 'ui.vue3';

import { editorAPI } from '../api';

import type { DocumentField, EntitySelectorItem } from '../types';

// Reactive on purpose: the field names are taken off this cache synchronously — by the condition
// previews of a node and by the tokens of a readable expression — so a surface rendered before its
// fields arrived would keep showing raw field keys with nothing to re-render it. With the cache as a
// reactive source such a reader re-runs on its own once the fields land, which is what lets a warm-up
// stay off the critical path of the panel (see withWarmDocumentFields). Shallow: a Map of Vue tracks
// reads per key, and the fields themselves stay raw objects — they are handed to legacy BP controls
// as they are.
const cache: Map<string, Array<DocumentField>> = shallowReactive(new Map());
const pendingRequests = new Cache.MemoryCache();

export function getDocumentTypeKey(documentType: string | Array<string>): string
{
	if (Type.isArray(documentType))
	{
		return documentType.join(':');
	}

	return String(documentType);
}

function mapItemToField(item: EntitySelectorItem): DocumentField | null
{
	const fieldKey = item.customData?.fieldKey ?? '';
	if (!fieldKey)
	{
		return null;
	}

	const fieldInfo = item.customData?.field ?? {};

	return {
		fieldKey,
		name: item.title ?? fieldKey,
		type: fieldInfo.type ?? 'string',
		multiple: fieldInfo.multiple ?? false,
		required: fieldInfo.required ?? false,
		options: fieldInfo.options ?? {},
		property: item.customData?.property ?? {},
	};
}

function handleFetchSuccess(key: string, items: Array<EntitySelectorItem>): Array<DocumentField>
{
	const fields = items.reduce((acc: Array<DocumentField>, element: EntitySelectorItem) => {
		const field = mapItemToField(element);
		if (field)
		{
			acc.push(field);
		}

		return acc;
	}, []);

	cache.set(key, fields);

	pendingRequests.delete(key);

	return fields;
}

function handleFetchError(key: string, error: Error): Array<DocumentField>
{
	console.error('documentFieldsCache: failed to fetch document fields', error);

	cache.set(key, []);
	pendingRequests.delete(key);

	return [];
}

export const documentFieldsCache = {
	has(documentType: string | Array<string>): boolean
	{
		return cache.has(getDocumentTypeKey(documentType));
	},

	get(documentType: string | Array<string>): Array<DocumentField> | null
	{
		return cache.get(getDocumentTypeKey(documentType)) ?? null;
	},

	set(documentType: string | Array<string>, fields: Array<DocumentField>): void
	{
		cache.set(getDocumentTypeKey(documentType), fields);
	},

	async fetchFields(documentType: string | Array<string>): Promise<Array<DocumentField>>
	{
		const key = getDocumentTypeKey(documentType);

		if (cache.has(key))
		{
			return cache.get(key);
		}

		return pendingRequests.remember(key, async () => {
			try
			{
				const items = await editorAPI.fetchDocumentFields(documentType);

				return handleFetchSuccess(key, items);
			}
			catch (error)
			{
				return handleFetchError(key, error);
			}
		});
	},
};
