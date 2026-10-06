import { Type, Runtime, Extension } from 'main.core';

import { diagramStore } from '../../../../entities/blocks';
// Direct file import (not the entities barrel) to avoid a cycle: the barrel re-exports
// common-settings-form, which reaches this module through expression-builder-mount.
import { ValueSelector } from '../../../../entities/common-node-settings/ui/common-settings-form/value-selector';
import { SYSTEM_VARIABLES } from '../../../../shared/constants';
import { documentFieldsCache } from '../../../../shared/utils/document-fields-cache';

export type NodeContext = {
	block?: ?Object,
	portId?: ?(string | number),
	connectedBlocks?: ?Array<Object>,
	// The construction the field belongs to, see EVALUATION_STAGE. Left out by the callers whose
	// fields are read before the workflow starts.
	evaluationStage?: ?string,
};

export type SourceItem = {
	id: string,
	title: string,
	subtitle: string,
	value: string,
	// Both type strings the modification mode needs, see SourceTypes in modifier-catalog.
	type: ?string,
	baseType: ?string,
	// Function items only: `false` for a call that takes no arguments at all.
	acceptsArguments?: boolean,
};

type GetMessage = (id: string, replacements?: Object) => string;

const BP_SELECTOR_EXTENSION = 'bp_selector';

let pendingFunctionsLoad: ?Promise<Array<SourceItem>> = null;

/**
 * Functions: plain data, no dialog. The editor page has `bp_selector` inlined already, so its
 * settings are read straight from the DOM on every call — `Extension.getSettings()` caches what it
 * parsed, so a repeated read is a lookup. The extension itself is loaded only when the settings are
 * absent, because for a legacy CJSCore extension that costs an ajax round trip and re-runs the
 * script: a portal whose function list is merely empty is a final answer and never pays for the
 * load. Loading it at all stays rebuild-safe: an unimported legacy extension cannot live in the
 * generated config.php `rel`. The load is memoized while in flight only — settings that arrive later
 * must still be picked up, so a fruitless attempt does not block the next one. Insertion keeps the
 * `{{=name()}}` shape (arguments typed by the user).
 *
 * A failed load rejects instead of passing an empty list off as the answer: "the portal has no
 * functions" and "the list could not be fetched" are different things to show and the reason has to
 * stay traceable.
 */
export function loadFunctionItems(): Promise<Array<SourceItem>>
{
	const inlinedItems = readFunctionSettings();
	if (inlinedItems)
	{
		return Promise.resolve(inlinedItems);
	}

	if (pendingFunctionsLoad)
	{
		return pendingFunctionsLoad;
	}

	pendingFunctionsLoad = Runtime.loadExtension(BP_SELECTOR_EXTENSION)
		.then(() => readFunctionSettings() ?? [])
		.catch((error) => {
			console.error(`expression builder: failed to load the ${BP_SELECTOR_EXTENSION} extension`, error);

			throw error;
		})
		.finally(() => {
			pendingFunctionsLoad = null;
		});

	return pendingFunctionsLoad;
}

/**
 * `null` means «the settings are not on the page», as opposed to an empty array — «they are, and
 * there are no functions». The inlined settings of `bp_selector` always carry the `functions` array
 * (bizproc/include.php:30), so a missing or malformed key is a missing settings node.
 */
function readFunctionSettings(): ?Array<SourceItem>
{
	const functions = Extension.getSettings(BP_SELECTOR_EXTENSION).get('functions');
	if (!Type.isArray(functions))
	{
		return null;
	}

	return functions.reduce((acc: Array<SourceItem>, func) => {
		if (Type.isStringFilled(func?.name))
		{
			acc.push({
				id: `fn:${func.name}`,
				title: func.name,
				subtitle: Type.isStringFilled(func.description) ? func.description : '',
				value: `{{=${func.name}()}}`,
				type: null,
				baseType: null,
				acceptsArguments: func.args !== false,
			});
		}

		return acc;
	}, []);
}

/**
 * Function items carry a call with empty parentheses, for a host where the user writes the arguments
 * in afterwards. A host that already knows what the formula is about — the data view dialog, where
 * the formula belongs to one column — passes that source and gets it as the first argument. A function
 * declared to take no arguments (`true`, `false`) keeps its empty parentheses: anything inside them is
 * a parse error.
 */
export function withFunctionArgument(item: SourceItem, argument: string): string
{
	return item.acceptsArguments !== false && Type.isStringFilled(argument)
		? item.value.replace('()', `(${argument})`)
		: item.value;
}

export function getSystemVariableItems(getMessage: GetMessage): Array<SourceItem>
{
	return SYSTEM_VARIABLES.map((entry) => {
		const value = `{=${entry.object}:${entry.field}}`;

		return {
			id: value,
			title: getMessage(entry.labelKey),
			subtitle: value,
			value,
			// The declared types are bizproc base types themselves, so the two coincide here.
			type: entry.type,
			baseType: entry.type,
		};
	});
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
export function collectSchemaSourceItems(nodeContext: ?NodeContext): Array<SourceItem>
{
	const { block = null, portId = null, connectedBlocks = null, evaluationStage } = nodeContext ?? {};
	if (!Type.isPlainObject(block) && !Type.isArrayFilled(connectedBlocks))
	{
		return [];
	}

	const selector = new ValueSelector(diagramStore(), block, portId, connectedBlocks, evaluationStage);
	const items = selector.getReturnItems();
	selector.addTemplateItems(items);

	const flat = [];
	flattenSelectorItems(items, flat);

	return flat;
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
