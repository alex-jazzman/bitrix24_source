import { defineStore } from 'ui.vue3.pinia';
import { markRaw } from 'ui.vue3';
import { Type, Text } from 'main.core';
import { UI } from 'ui.notification';

import { dataViewEditorApi, splitSource } from '../api';

export type SourceDescriptor = {
	module: string,
	entity: string,
	title: string,
	bounded: boolean,
	requiresParams: boolean,
	params: Object,
	unavailable?: boolean,
};

export type SourceSchema = {
	fields: Array<Object>,
	relations: Array<Object>,
};

export type StampConstantDescriptor = {
	module: string,
	entity: string,
	params: Object,
	title: string,
	type: string,
};

type MetaState = {
	sources: Array<SourceDescriptor>,
	schemas: Object,
	stampConstants: Array<StampConstantDescriptor>,
	isLoadingSources: boolean,
	isLoadingStampConstants: boolean,
	hasLoadedStampConstants: boolean,
	lastFetchId: number,
	lastStampConstantsFetchId: number,
};

/**
 * Cache key of a source: two sources of the same entity differ only by their params, and a source
 * without params describes itself once. Params are serialized by sorted key, so an equal set of
 * params always yields an equal key.
 */
export function sourceKey(source: ?Object): string
{
	const module = String(source?.module ?? '');
	const entity = String(source?.entity ?? '');
	const params = Type.isPlainObject(source?.params) ? source.params : {};
	const keys = Object.keys(params).sort();
	if (keys.length === 0)
	{
		return `${module}:${entity}`;
	}

	const serialized = keys.map((key) => `${key}=${String(params[key])}`).join(',');

	return `${module}:${entity}:${serialized}`;
}

/** A source reference is addressable once it names an entity of some module. */
export function isSourceRefFilled(source: ?{ module?: string, entity?: string }): boolean
{
	return Type.isStringFilled(source?.module) && Type.isStringFilled(source?.entity);
}

/**
 * The schema field a column reads: its `alias.FIELD` source names one of the sources the definition
 * holds and a field of that source's schema. Null for a stamp, which holds a constant instead of a
 * source value, and while the schema of the source has not been loaded yet.
 *
 * @param {Array<{ alias: string }>} sources sources of the edited definition
 */
export function findColumnSchemaField(metaStore: Object, sources: Array<Object>, columnSource: ?string): ?Object
{
	const { alias, field } = splitSource(columnSource ?? '');
	const source = sources.find((item) => item.alias === alias);

	return metaStore.getSchema(source)?.fields?.find((item) => item.code === field) ?? null;
}

function notifyError(error: Error): void
{
	UI.Notification.Center.notify({
		content: Text.encode(error?.message ?? ''),
		autoHideDelay: 4000,
	});
}

function pairKey(pair: Object): string
{
	return `${pair.left}:${pair.right}`;
}

/**
 * Join-key pairs a relation offers between two entities, oriented left-to-right: a relation
 * pointing from `b` to `a` describes the same link and is flipped rather than dropped.
 */
function pairsFromRelations(relations: ?Array<Object>, leftEntity: string, rightEntity: string): Array<Object>
{
	return (Type.isArray(relations) ? relations : []).reduce((pairs, relation) => {
		if (relation?.fromEntity === leftEntity && relation?.toEntity === rightEntity)
		{
			pairs.push({ left: relation.fromField, right: relation.toField, title: relation.title ?? '' });
		}
		else if (relation?.fromEntity === rightEntity && relation?.toEntity === leftEntity)
		{
			pairs.push({ left: relation.toField, right: relation.fromField, title: relation.title ?? '' });
		}

		return pairs;
	}, []);
}

/**
 * Metadata behind the editor: the catalog of sources the user may pick (API-04) and the schema of
 * each picked one (API-05). Schemas are fetched lazily and kept for the lifetime of the editor
 * session — reopening the editor starts from a clean cache.
 */
export const useDataViewMetaStore = defineStore('bizprocdesigner-editor-data-view-meta', {
	state: (): MetaState => ({
		sources: [],
		schemas: {},
		stampConstants: [],
		isLoadingSources: false,
		isLoadingStampConstants: false,
		hasLoadedStampConstants: false,
		lastFetchId: 0,
		lastStampConstantsFetchId: 0,
	}),
	getters:
	{
		hasSources: (state: MetaState): boolean => state.sources.length > 0,
		hasStampConstants: (state: MetaState): boolean => state.stampConstants.length > 0,
	},
	actions:
	{
		/**
		 * Catalog of pickable sources (API-04). `templateId` is the template the editor was opened
		 * for. The catalog then also offers that template's own constants and variables (API-06).
		 * The context is not kept here: it belongs to the definition being edited, and this store
		 * would only hold a copy to keep in sync.
		 */
		async loadSources(templateId: ?number = null): Promise<void>
		{
			const fetchId = ++this.lastFetchId;
			this.isLoadingSources = true;
			try
			{
				const data = await dataViewEditorApi.getSources({ templateId });
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.sources = Type.isArray(data?.sources) ? data.sources : [];
			}
			catch (error)
			{
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.sources = [];
				notifyError(error);
			}
			finally
			{
				if (this.lastFetchId === fetchId)
				{
					this.isLoadingSources = false;
				}
			}
		},
		/**
		 * Scalar constants available as stamp columns (API-09). This request has its own sequence:
		 * loading sources and stamps in parallel must not invalidate either response.
		 */
		async loadStampConstants(templateId: ?number = null): Promise<void>
		{
			const fetchId = ++this.lastStampConstantsFetchId;
			this.isLoadingStampConstants = true;
			try
			{
				const data = await dataViewEditorApi.getStampConstants({ templateId });
				if (this.lastStampConstantsFetchId !== fetchId)
				{
					return;
				}

				this.stampConstants = Type.isArray(data?.constants) ? data.constants : [];
				this.hasLoadedStampConstants = true;
			}
			catch (error)
			{
				if (this.lastStampConstantsFetchId !== fetchId)
				{
					return;
				}

				this.stampConstants = [];
				this.hasLoadedStampConstants = false;
				notifyError(error);
			}
			finally
			{
				if (this.lastStampConstantsFetchId === fetchId)
				{
					this.isLoadingStampConstants = false;
				}
			}
		},
		/**
		 * Schema of a source, from the session cache or from the server. Concurrent callers asking for
		 * the same source share one request; a resolved schema is never fetched twice. `templateId`
		 * carries the same catalog context as {@see loadSources} (API-07). A source of the template
		 * describes itself only under it. The cache key stays the plain source key: the params of a
		 * template source already name their template (DTO-03), so two templates never share an entry.
		 *
		 * @return {Promise<?SourceSchema>} null when the source has no schema to offer
		 */
		async loadSchema(source: Object, templateId: ?number = null): Promise<?SourceSchema>
		{
			if (!isSourceRefFilled(source))
			{
				return null;
			}

			const key = sourceKey(source);
			const cached = this.schemas[key];
			if (cached)
			{
				return cached.request ?? cached.schema;
			}

			const request = (async () => {
				try
				{
					const data = await dataViewEditorApi.getSourceSchema({
						module: source.module,
						entity: source.entity,
						params: Type.isPlainObject(source.params) ? source.params : null,
						templateId,
					});

					// markRaw: the schema is a read-only cache of up to hundreds of CRM fields and relations.
					// Deep Pinia reactivity would proxy the whole DTO for no benefit.
					const schema: SourceSchema = markRaw({
						fields: Type.isArray(data?.fields) ? data.fields : [],
						relations: Type.isArray(data?.relations) ? data.relations : [],
					});
					// No lastFetchId guard here (unlike loadSources): the schema is a pure function of its
					// cache key, so a response landing after reset() writes an identical entry under the same
					// key — harmless. The shared counter guard would also wrongly cancel concurrent schema
					// loads and any in-flight loadSources, so it must not be copied onto this path.
					this.schemas = { ...this.schemas, [key]: { schema, request: null } };

					return schema;
				}
				catch (error)
				{
					// A failed schema leaves no cache entry: the next pick retries instead of
					// showing a source that silently has no fields.
					const { [key]: dropped, ...rest } = this.schemas;
					this.schemas = rest;
					notifyError(error);

					return null;
				}
			})();

			this.schemas = { ...this.schemas, [key]: { schema: null, request } };

			return request;
		},
		/** Cached schema of a source, or null while it has not been loaded. */
		getSchema(source: ?Object): ?SourceSchema
		{
			return this.schemas[sourceKey(source)]?.schema ?? null;
		},
		/**
		 * Describes a source for the UI. The catalog lists every bizproc storage as its own entry of the
		 * same module and entity, so the entry is matched by the full source key — params included —
		 * rather than by entity alone. A source held by a definition but missing from the catalog — a
		 * deleted storage, revoked access, an uninstalled module — is described as unavailable rather
		 * than dropped, so the editor can show what the view refers to.
		 */
		describeSource(source: ?Object): SourceDescriptor
		{
			const key = sourceKey(source);
			const known = this.sources.find((item) => sourceKey(item) === key);
			if (known)
			{
				return known;
			}

			return {
				module: String(source?.module ?? ''),
				entity: String(source?.entity ?? ''),
				title: '',
				bounded: false,
				requiresParams: false,
				params: Type.isPlainObject(source?.params) ? { ...source.params } : {},
				unavailable: true,
			};
		},
		isSourceAvailable(source: ?Object): boolean
		{
			return !this.describeSource(source).unavailable;
		},
		/**
		 * Join-key pairs linking two sources, collected from the relations of both schemas. Returns an
		 * empty list while either schema is missing — the caller then picks the keys by hand.
		 *
		 * @return {Array<{ left: string, right: string, title: string }>} `left` belongs to `a`
		 */
		suggestJoinKeys(a: ?Object, b: ?Object): Array<Object>
		{
			const schemaA = this.getSchema(a);
			const schemaB = this.getSchema(b);
			if (!schemaA || !schemaB)
			{
				return [];
			}

			const leftEntity = String(a?.entity ?? '');
			const rightEntity = String(b?.entity ?? '');
			const pairs = [
				...pairsFromRelations(schemaA.relations, leftEntity, rightEntity),
				...pairsFromRelations(schemaB.relations, leftEntity, rightEntity),
			].filter((pair) => Type.isStringFilled(pair.left) && Type.isStringFilled(pair.right));

			const seen = new Set();

			return pairs.filter((pair) => {
				const key = pairKey(pair);
				if (seen.has(key))
				{
					return false;
				}
				seen.add(key);

				return true;
			});
		},
		reset(): void
		{
			// Advancing the counter past every in-flight fetch id keeps a late catalog response from
			// landing in the session that follows the reset.
			const { lastFetchId, lastStampConstantsFetchId } = this;
			this.$reset();
			this.lastFetchId = lastFetchId + 1;
			this.lastStampConstantsFetchId = lastStampConstantsFetchId + 1;
		},
	},
});
