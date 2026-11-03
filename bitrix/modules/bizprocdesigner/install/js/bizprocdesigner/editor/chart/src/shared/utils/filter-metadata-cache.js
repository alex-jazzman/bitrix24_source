import { editorAPI } from '../api';

export type FilterMetadataParams = {
	activityType: string,
	contextActivityType?: ?string,
	documentType: Array<string>,
	onlyDynamicEntities: boolean,
	includeRelatedEntityTypes: boolean,
};

// Every filter construction of a node asks for the same metadata, so within one open panel the
// request is shared instead of repeated. The answer is only good for the node it was asked for:
// clear() when the next node starts loading and when the panel closes keeps a later opening from
// showing fields that have changed meanwhile.
const pending: Map<string, Promise<?Object>> = new Map();

function buildKey(params: FilterMetadataParams): string
{
	return [
		params.activityType,
		params.contextActivityType ?? '',
		params.documentType.join('@'),
		params.onlyDynamicEntities,
		params.includeRelatedEntityTypes,
	].join('|');
}

export const filterMetadataCache = {
	load(params: FilterMetadataParams): Promise<?Object>
	{
		const key = buildKey(params);
		if (pending.has(key))
		{
			return pending.get(key);
		}

		const request = editorAPI.getNodeFilterMetadata(params);
		pending.set(key, request);

		// A failure is not an answer worth keeping: the next construction has to ask again.
		request.catch(() => {
			if (pending.get(key) === request)
			{
				pending.delete(key);
			}
		});

		return request;
	},

	clear(): void
	{
		pending.clear();
	},
};
