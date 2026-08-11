import { Cache, Type } from 'main.core';
import { editorAPI } from '../api';

import type { DocumentField, EntitySelectorItem } from '../types';

const cache = new Cache.MemoryCache();
const pendingRequests = new Cache.MemoryCache();

function getKey(documentType: string | Array<string>): string
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

	if (fields.length > 0)
	{
		cache.set(key, fields);
	}

	pendingRequests.delete(key);

	return fields;
}

function handleFetchError(key: string, error: Error): Array<DocumentField>
{
	console.error('documentFieldsCache: failed to fetch document fields', error);

	pendingRequests.delete(key);

	return [];
}

export const documentFieldsCache = {
	has(documentType: string | Array<string>): boolean
	{
		return cache.has(getKey(documentType));
	},

	get(documentType: string | Array<string>): Array<DocumentField> | null
	{
		return cache.get(getKey(documentType), null);
	},

	set(documentType: string | Array<string>, fields: Array<DocumentField>): void
	{
		cache.set(getKey(documentType), fields);
	},

	async fetchFields(documentType: string | Array<string>): Promise<Array<DocumentField>>
	{
		const key = getKey(documentType);

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
