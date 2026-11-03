import { Loc, Type } from 'main.core';
import { getSystemVariableItems, type Section, type SourceItem } from 'bizprocdesigner.expression-builder';

import { diagramStore } from '../../../entities/blocks';
// Direct file import (not the entities barrel) to avoid a cycle: the barrel re-exports
// common-settings-form, which reaches this module through expression-builder-mount.
import { ValueSelector } from '../../../entities/common-node-settings/ui/common-settings-form/value-selector';
import { documentFieldsCache } from '../../../shared/utils/document-fields-cache';
import { loadProcessDataCatalog } from '../../../entities/process-data/groups';
import { systemValuesCache } from '../../../shared/utils/system-values-cache';

// The staged answer the window takes. See the `sourcesProvider` prop docblock in
// expression-builder-body.js for the staged contract.
type SourceItemsById = { [string]: Array<SourceItem> };

export type StagedSections =
	| Array<Section>
	| { sections: Array<Section>, pending: Promise<StagedSections> };

export type NodeContext = {
	block?: ?Object,
	portId?: ?(string | number),
	connectedBlocks?: ?Array<Object>,
	// The construction the field belongs to, see EVALUATION_STAGE. Left out by the callers whose
	// fields are read before the workflow starts.
	evaluationStage?: ?string,
};

/**
 * Everything the editor offers the value constructor as a source, in the sections the window shows
 * them in: the fields of the document, the schema of the workflow around the node and the system
 * values. The window owns none of this — it is handed the finished list, and this is where the
 * list is built.
 *
 * The context of the node is the caller's to pass at the moment the collection is asked for: the
 * schema section is the returns of the ancestors of that very node.
 *
 * Two of the three sections may be on their way from the server — the fields of a document and the
 * catalog of system values, each with a cold cache — and both requests start in the same tick, so the
 * one that answered first is published first. An empty section is left out: the window draws no group
 * for a source that has none.
 *
 * Answers in stages (DTO-01). See the `sourcesProvider` prop docblock in expression-builder-body.js
 * for the staged contract.
 */
export function collectEditorSourceSections(nodeContext: ?NodeContext): StagedSections
{
	const buildSections = (items: SourceItemsById): Array<Section> => [
		{
			id: 'documents',
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SECTION_DOCUMENT'),
			items: items.documents,
		},
		{
			id: 'schema',
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SECTION_SCHEMA'),
			items: items.schema,
		},
		{
			id: 'system',
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SECTION_SYSTEM'),
			items: items.system,
		},
	].filter((section) => Type.isArrayFilled(section.items));

	const collected = {
		documents: getDocumentFieldItems(),
		schema: collectSchemaSourceItems(nodeContext),
		system: getSystemValueItems(),
	};
	const isPending = (items: mixed): boolean => items instanceof Promise;

	// An empty list stands for every source still on the way: such a section drops out of the set,
	// and the ones that are plain data already are shown on their own until a request answers.
	const known = {};
	const waiting = [];
	Object.entries(collected).forEach(([id, items]) => {
		known[id] = isPending(items) ? [] : items;
		if (isPending(items))
		{
			waiting.push({ id, items });
		}
	});

	return stageSections(known, waiting, buildSections);
}

/**
 * Builds one stage and, while anything is still on the way, the promise of the next one: the race is
 * what makes that promise settle on the first request to answer rather than on all of them. See the
 * `sourcesProvider` prop docblock in expression-builder-body.js for the staged contract.
 */
function stageSections(
	known: SourceItemsById,
	waiting: Array<{ id: string, items: Promise<Array<SourceItem>> }>,
	buildSections: (SourceItemsById) => Array<Section>,
): StagedSections
{
	const sections = buildSections(known);
	if (waiting.length === 0)
	{
		return sections;
	}

	const pending = Promise
		.race(waiting.map((entry) => entry.items.then((items: Array<SourceItem>) => ({ id: entry.id, items }))))
		.then(({ id, items }) => stageSections(
			{ ...known, [id]: items },
			waiting.filter((entry) => entry.id !== id),
			buildSections,
		));

	return { sections, pending };
}

/**
 * System values: the catalog the server publishes, read through the reactive cache of the editor. The
 * page of the editor carries the settings of `bp_selector` inlined, so a warm cache answers
 * synchronously; a cold one is asked of the server. A load that broke is settled too — the cache has
 * logged the reason and holds an empty catalog, and asking again would change nothing.
 */
function getSystemValueItems(): Array<SourceItem> | Promise<Array<SourceItem>>
{
	if (systemValuesCache.hasSettled())
	{
		return getSystemVariableItems(systemValuesCache.get());
	}

	return systemValuesCache.load().then(getSystemVariableItems);
}

/**
 * Document fields of the current template document: plain data through the caching wrapper
 * (ajax, but no dialog). Reference format mirrors bizproc `{=Document:FIELD_ID}`
 * (see bizproc/lib/automation/helper.php:456). Returns synchronously when the cache is warm.
 */
export function getDocumentFieldItems(): Array<SourceItem> | Promise<Array<SourceItem>>
{
	const documentType = diagramStore().documentType;
	if (!Type.isArrayFilled(documentType) && !Type.isStringFilled(documentType))
	{
		return [];
	}

	const mapFields = (fields: Array<Object>): Array<SourceItem> => fields.map((field) => {
		const value = `{=Document:${field.fieldKey}}`;
		const type = Type.isStringFilled(field.type) ? field.type : null;
		// The base type comes with the field property; falling back to the concrete type mirrors the
		// server, which fills `BaseType` from `Type` when the document provider left it out
		// (bizproc/lib/automation/helper.php).
		const baseType = field.property?.BaseType;

		return {
			id: value,
			title: Type.isStringFilled(field.name) ? field.name : field.fieldKey,
			subtitle: value,
			value,
			type,
			baseType: Type.isStringFilled(baseType) ? baseType : type,
		};
	});

	if (documentFieldsCache.has(documentType))
	{
		return mapFields(documentFieldsCache.get(documentType) ?? []);
	}

	return documentFieldsCache.fetchFields(documentType).then(mapFields);
}

/**
 * Schema sources: ancestor block returns plus template parameters/variables/constants.
 * Reuses ValueSelector's collection (getReturnItems + addTemplateItems) and flattens the nested
 * entity-selector item tree into leaves carrying the insertable `{=...}` id and its declared type.
 */
export function collectSchemaSourceItems(
	nodeContext: ?NodeContext,
): Array<SourceItem> | Promise<Array<SourceItem>>
{
	const { block = null, portId = null, connectedBlocks = null, evaluationStage } = nodeContext ?? {};
	if (!Type.isPlainObject(block) && !Type.isArrayFilled(connectedBlocks))
	{
		return [];
	}

	const collect = (): Array<SourceItem> => {
		const selector = new ValueSelector(diagramStore(), block, portId, connectedBlocks, evaluationStage);
		const items = selector.getReturnItems();
		selector.addTemplateItems(items);

		const flat = [];
		flattenSelectorItems(items, flat);

		return flat;
	};

	// Without the catalog of the process data a pair is offered by both of its halves, so a read still
	// on its way is waited for. A template of the previous mechanics and a catalog already read have
	// nothing to read and collect in the same tick; a read that broke leaves the previous grouping.
	const catalogRead = loadProcessDataCatalog();

	return catalogRead === null ? collect() : catalogRead.then(collect, collect);
}

function flattenSelectorItems(items: Array<Object>, acc: Array<SourceItem>): void
{
	items.forEach((item) => {
		if (Type.isArrayFilled(item?.children))
		{
			flattenSelectorItems(item.children, acc);

			return;
		}

		const value = item?.id;
		if (!Type.isStringFilled(value) || !value.startsWith('{='))
		{
			return;
		}

		const property = item.customData?.property ?? {};
		const type = Type.isStringFilled(property.Type) ? property.Type : null;

		acc.push({
			id: value,
			title: Type.isStringFilled(item.title) ? item.title : value,
			subtitle: value,
			value,
			type,
			baseType: Type.isStringFilled(property.BaseType) ? property.BaseType : type,
		});
	});
}
