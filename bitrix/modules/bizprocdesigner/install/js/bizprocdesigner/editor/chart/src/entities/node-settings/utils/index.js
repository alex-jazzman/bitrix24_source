import { Loc, Type } from 'main.core';
import { PROPERTY_TYPES } from '../../../shared/constants';
import { type ActivityData, type ActivityProperty, type Block } from '../../../shared/types';
import { documentFieldsCache } from '../../../shared/utils';
import { diagramStore } from '../../blocks';
import { PORTLESS_RULES_KEY } from '../api';
import { CONSTRUCTION_TYPES, FIELD_OBJECT_TYPES } from '../constants';
import {
	type ConditionExpressionField,
	type ConnectedBlocksContext,
	type Construction,
	type NodeSettings,
	type TRuleCard,
	type Rule,
} from '../types';
import {
	type SignatureCachedValue,
	collectSyntheticFilterReturnProperties,
	getActivitySignature,
} from './filter-return-properties';
import { getFixedDocumentType } from './property-dialog-document-type';
import {
	type ExpressionRefToken,
	FIELD_LOOKUP_STEPS,
	OBJECT_NAMES,
	TOKEN_PATH_SEPARATOR,
	findDocumentField,
	getActivityReturnProperties,
	resolveExpressionReferenceWithPending,
} from './readable-expressions';

export { collectAllConstructions, getFilterEntityTitle } from './filter-return-properties';
export { resolveNodeBrokenLinkSections } from './node-broken-links';
export type {
	NodeBrokenLinkItem,
	NodeBrokenLinkRulePort,
	NodeBrokenLinkSections,
	NodeBrokenLinkTarget,
} from './node-broken-links';
export { areNodeSettingsDirty } from './node-settings-dirty';
export { generateNextInputPortId, generateNextOutputPortId, getPortsSignature } from './port-ids';
export { getFixedDocumentType } from './property-dialog-document-type';
export {
	buildFilterMetadataParams,
	resolveFilterBackingActivityType,
	resolveFilterContextDocumentType,
	resolveFilterFixedEntityTypeId,
} from './filter-metadata';
export {
	getUnreachableOutputPortIds,
	isOutputReachable,
	isOutputReachableInAnyState,
} from './output-reachability';
export {
	buildExpressionTokens,
	isReadableExpressionsAvailable,
	resolveExpressionReference,
	tokenSectionClass,
} from './readable-expressions';
export { settingsFormRequestCache } from './settings-form-request-cache';
export {
	findGroupRuleCardForType,
	findHeadRuleCard,
	getGroupConstructionName,
	getGroupRuleCards,
	isHeadConstructionType,
	splitRulesSurface,
} from './rules-surface';
export {
	carriesAuxPortReference,
	getActionAuxPortIdsFromActivity,
	getActionAuxPortIdsFromRules,
	getActionAuxPortsFromActivity,
	getActionAuxPortsFromRules,
} from './action-aux-ports';

type FoundBlockAndActivity = {
	block: Block | null,
	activity: ActivityData | null,
};

type ExtractedDocumentData = {
	block: Block,
	activity: ActivityData,
	field: ActivityProperty,
};

type ConditionFieldTitle = {
	title: string,
	pending: Promise<mixed> | null,
	unresolved: string | null,
};

type ResolvedFieldName = {
	name: string | null,
	pending: Promise<mixed> | null,
	// The fields of the document did arrive and hold no such key: unlike a name still on its way, this
	// is a fact about the field and not about the loading.
	missing: boolean,
};

type TemplateDataObject = {
	object: string,
	templateKey: string,
	titleKey: string,
};

type ConditionFieldSource = {
	templateData: TemplateDataObject | null,
	templateRecord: Object | null,
	block: Block | null,
	activity: ActivityData | null,
	property: ActivityProperty | null,
	propertyId: string,
	tailParts: Array<string>,
	isDocumentItem: boolean,
};

const CONDITION_SOURCE_SEPARATOR = ' — ';
const CONDITION_FAILOVER_SEPARATOR = ' / ';
const DOCUMENT_ITEM_ID_SEPARATOR = ':';
const REFERENCE_PATH_SEPARATORS = Object.freeze([TOKEN_PATH_SEPARATOR, '.']);

/**
 * Why the caption stayed technical, and only about a reference that is broken for good: a source, a
 * property, a template record or a field of a document that is gone. A name of a document field that
 * has simply not arrived yet is not a reason — otherwise the warning would blink on every foreign
 * document while it loads.
 */
const UNRESOLVED_REASONS = Object.freeze({
	SOURCE: 'source',
	PROPERTY: 'property',
	TEMPLATE_DATA: 'templateData',
	DOCUMENT_FIELD: 'documentField',
});

const UNRESOLVED_HINT_KEYS = Object.freeze({
	[UNRESOLVED_REASONS.SOURCE]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_FIELD_UNRESOLVED_SOURCE',
	[UNRESOLVED_REASONS.PROPERTY]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_FIELD_UNRESOLVED_PROPERTY',
	[UNRESOLVED_REASONS.TEMPLATE_DATA]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_FIELD_UNRESOLVED_TEMPLATE_DATA',
	[UNRESOLVED_REASONS.DOCUMENT_FIELD]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_FIELD_UNRESOLVED_DOCUMENT_FIELD',
});

const TEMPLATE_DATA_OBJECTS = Object.freeze([
	{
		object: FIELD_OBJECT_TYPES.PARAMETER,
		templateKey: 'PARAMETERS',
		titleKey: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_PARAMETER_OBJECT',
	},
	{
		object: FIELD_OBJECT_TYPES.VARIABLE,
		templateKey: 'VARIABLES',
		titleKey: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_VARIABLE_OBJECT',
	},
	{
		object: FIELD_OBJECT_TYPES.CONSTANT,
		templateKey: 'CONSTANTS',
		titleKey: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_CONSTANT_OBJECT',
	},
]);

/**
 * The name of the field leads and the source follows it in brackets, listed from the particular to the
 * general: the name of the document property first, the title of the source block after it. So the
 * ellipsis of a single-line control eats the source and not the name of the field.
 */
function composeConditionFieldTitle(fieldTitle: ?string, sourceParts: Array<?string>): string
{
	const source = sourceParts.filter(Boolean).join(CONDITION_SOURCE_SEPARATOR);
	if (!Type.isStringFilled(fieldTitle))
	{
		return source;
	}

	return Type.isStringFilled(source) ? `${fieldTitle} (${source})` : fieldTitle;
}

/**
 * The key is looked up by the steps of the server ({@see findDocumentField}), shared with the resolver of
 * the readable expressions: two searches over the same fields must not drift apart.
 *
 * An empty list is not an answer: that is what both a failed request and a document the user has no
 * access to leave in the cache, so it reports neither a name nor a missing field. A list that did arrive
 * is the answer, and a key whose every prefix missed names a field that is gone — the fields come from
 * the same provider the field dialog itself is built of.
 */
function resolveDocumentFieldName(documentType: ?Array<string>, fieldKey: string): ResolvedFieldName
{
	if (!Type.isArrayFilled(documentType))
	{
		return { name: null, pending: null, missing: false };
	}

	const cachedFields = documentFieldsCache.get(documentType);
	if (!Type.isArrayFilled(cachedFields))
	{
		return {
			name: null,
			pending: documentFieldsCache.has(documentType) ? null : documentFieldsCache.fetchFields(documentType),
			missing: false,
		};
	}

	const found = findDocumentField(cachedFields, fieldKey);
	if (!found)
	{
		return { name: null, pending: null, missing: true };
	}

	return {
		name: [found.field.name, ...found.tail].join(TOKEN_PATH_SEPARATOR),
		pending: null,
		missing: found.step === FIELD_LOOKUP_STEPS.NOCASE,
	};
}

function unresolvedConditionFieldTitle(unresolved: string): ConditionFieldTitle
{
	return { title: '', pending: null, unresolved };
}

/**
 * Nothing to build a caption from, yet nothing broken either: the caller keeps the raw reference and no
 * warning is raised over it.
 */
function rawConditionFieldTitle(): ConditionFieldTitle
{
	return { title: '', pending: null, unresolved: null };
}

function evaluateDocumentConditionFieldTitle(documentType: ?Array<string>, fieldId: string): ConditionFieldTitle
{
	const { name, pending, missing } = resolveDocumentFieldName(documentType, fieldId);

	return {
		title: composeConditionFieldTitle(name ?? fieldId, [Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT')]),
		pending,
		unresolved: missing ? UNRESOLVED_REASONS.DOCUMENT_FIELD : null,
	};
}

/**
 * The parent item of the field dialog is selectable as well, and it carries `<sourceId>:<propertyId>` —
 * the document as a whole rather than a field of it. Nothing resolves from such an id, but nothing is
 * broken either: the raw caption stays and the warning must not accuse a choice just made.
 */
function isDocumentItemId(block: Block, activity: ActivityData, fieldId: string): boolean
{
	const [sourceId, propertyId, ...rest] = fieldId.split(DOCUMENT_ITEM_ID_SEPARATOR);
	const isOwnSourceId = sourceId === block.id || sourceId === activity.Name;
	if (rest.length > 0 || !isOwnSourceId || !Type.isStringFilled(propertyId))
	{
		return false;
	}

	return getActivityReturnProperties(activity).some((property: ActivityProperty): boolean => {
		return property?.Id === propertyId && property?.Type === PROPERTY_TYPES.DOCUMENT;
	});
}

/**
 * A source of data that is no block of the diagram: a system variable, a global constant, the input of the
 * process. Such an object is named by the resolver of the readable expressions alone, and only under a
 * feature flag of its own — a name that did not resolve says nothing about a node being deleted.
 */
function isNonBlockObject(object: string): boolean
{
	return OBJECT_NAMES[object.toLowerCase()] === object;
}

const EMPTY_CONDITION_FIELD_SOURCE: ConditionFieldSource = Object.freeze({
	templateData: null,
	templateRecord: null,
	block: null,
	activity: null,
	property: null,
	propertyId: '',
	tailParts: [],
	isDocumentItem: false,
});

/**
 * One reading of the source of a field: the caption and the signature the caption is rebuilt by walk it
 * together, so a second reading of the same reference cannot drift away from the first one unnoticed.
 * The object `Document` is none of this — it names a document type rather than a source to look up.
 */
function resolveConditionFieldSource(
	connectedBlocks: Block[],
	object: string,
	fieldId: string,
): ConditionFieldSource
{
	const templateData = TEMPLATE_DATA_OBJECTS.find((item: TemplateDataObject) => item.object === object);
	if (templateData)
	{
		return {
			...EMPTY_CONDITION_FIELD_SOURCE,
			templateData,
			templateRecord: (diagramStore().template[templateData.templateKey] ?? {})[fieldId] ?? null,
		};
	}

	const { block, activity }: FoundBlockAndActivity = findBlockAndActivityByName(connectedBlocks, object);
	if (!block || !activity)
	{
		return EMPTY_CONDITION_FIELD_SOURCE;
	}

	const [propertyId, ...tailParts] = fieldId.split('.');

	return {
		...EMPTY_CONDITION_FIELD_SOURCE,
		block,
		activity,
		property: getActivityReturnProperties(activity).find((prop: ActivityProperty) => prop.Id === propertyId) ?? null,
		propertyId,
		tailParts,
		isDocumentItem: isDocumentItemId(block, activity, fieldId),
	};
}

function evaluateBlockConditionFieldTitle(source: ConditionFieldSource, object: string): ConditionFieldTitle
{
	const { block, activity, property, propertyId, tailParts, isDocumentItem } = source;
	if (!block || !activity)
	{
		return isNonBlockObject(object)
			? rawConditionFieldTitle()
			: unresolvedConditionFieldTitle(UNRESOLVED_REASONS.SOURCE)
		;
	}

	if (!property)
	{
		return isDocumentItem
			? rawConditionFieldTitle()
			: unresolvedConditionFieldTitle(UNRESOLVED_REASONS.PROPERTY)
		;
	}

	const blockTitle = activity.Properties?.Title ?? block.node?.title;
	const propertyTitle = Type.isStringFilled(property.Name) ? property.Name : propertyId;
	if (tailParts.length === 0)
	{
		return {
			title: composeConditionFieldTitle(propertyTitle, [blockTitle]),
			pending: null,
			unresolved: null,
		};
	}

	const fieldKey = tailParts.join('.');
	const { name, pending, missing } = resolveDocumentFieldName(
		property.Type === PROPERTY_TYPES.DOCUMENT ? property.Default : null,
		fieldKey,
	);

	return {
		title: composeConditionFieldTitle(name ?? fieldKey, [propertyTitle, blockTitle]),
		pending,
		unresolved: missing ? UNRESOLVED_REASONS.DOCUMENT_FIELD : null,
	};
}

function evaluateTemplateConditionFieldTitle(source: ConditionFieldSource): ConditionFieldTitle
{
	const fieldName = source.templateRecord?.Name;

	return Type.isStringFilled(fieldName)
		? {
			title: composeConditionFieldTitle(fieldName, [Loc.getMessage(source.templateData.titleKey)]),
			pending: null,
			unresolved: null,
		}
		: unresolvedConditionFieldTitle(UNRESOLVED_REASONS.TEMPLATE_DATA)
	;
}

function evaluateOwnConditionFieldTitle(
	connectedBlocks: Block[],
	object: string,
	fieldId: string,
	documentType: ?Array<string>,
): ConditionFieldTitle
{
	if (object === FIELD_OBJECT_TYPES.DOCUMENT)
	{
		return evaluateDocumentConditionFieldTitle(documentType ?? diagramStore().documentType, fieldId);
	}

	const source = resolveConditionFieldSource(connectedBlocks, object, fieldId);

	return source.templateData
		? evaluateTemplateConditionFieldTitle(source)
		: evaluateBlockConditionFieldTitle(source, object)
	;
}

/**
 * The raw reference as a caption: the object and the id of the field as they were saved. One place for
 * the rule — the own build of the caption falls back to it, and a preview card renders it for a
 * construction its map of captions has not caught up with yet, without resolving anything.
 */
export const getConditionFieldFailoverTitle = (field: ?ConditionExpressionField): string => {
	return [field?.object, field?.fieldId].filter(Boolean).join(CONDITION_FAILOVER_SEPARATOR);
};

/**
 * The source of a token of the resolver in full. Its path runs from the general to the particular —
 * source, then the title of the document property, then the name of the field — while the caption lists
 * the source the other way round, so the middle of the path is exactly what the pair of the source and
 * the field alone would drop. The parts of the name are cut off by the caption of the field itself: the
 * resolver joins them either by its own separator or by a dot.
 */
function getReferenceSourceParts(reference: ExpressionRefToken): Array<?string>
{
	const path = Type.isArray(reference.path) ? reference.path : [];
	const parts = path[0] === reference.sourceTitle ? path.slice(1) : path;
	for (let fieldLength = 1; fieldLength <= parts.length; fieldLength += 1)
	{
		const fieldParts = parts.slice(parts.length - fieldLength);
		const isFieldTail = REFERENCE_PATH_SEPARATORS.some((separator: string): boolean => {
			return fieldParts.join(separator) === reference.fieldTitle;
		});

		if (isFieldTail)
		{
			return [...parts.slice(0, parts.length - fieldLength).reverse(), reference.sourceTitle];
		}
	}

	return [reference.sourceTitle];
}

export const evaluateConditionExpressionFieldTitle = (
	connectedBlocks: Block[],
	field: ConditionExpressionField,
	documentType: ?Array<string> = null,
): ConditionFieldTitle => {
	const object = field?.object ?? '';
	const fieldId = field?.fieldId ?? '';
	const failoverTitle = getConditionFieldFailoverTitle(field);

	// The transport DTO allows a condition whose field is not picked yet: there is nothing to build a
	// caption from, and an exception here would take down the whole settings panel with it.
	if (!Type.isStringFilled(fieldId))
	{
		return { title: failoverTitle, pending: null, unresolved: null };
	}

	const ownTitle = evaluateOwnConditionFieldTitle(connectedBlocks, object, fieldId, documentType);
	if (Type.isStringFilled(ownTitle.title))
	{
		return ownTitle;
	}

	// Insurance rather than the first attempt: the resolver of the readable expressions works under a
	// feature flag of its own, so the caption must not wait for it and its token is brought to the same
	// format. Only the objects the resolver alone knows — system variables, globals, input — reach here.
	const resolvedReference = resolveExpressionReferenceWithPending(
		{ object, field: fieldId },
		connectedBlocks,
		documentType,
	);
	const reference = resolvedReference?.token ?? null;
	const isResolvedByReference = Boolean(reference) && reference.unresolved === null;

	return {
		title: isResolvedByReference
			? composeConditionFieldTitle(reference.fieldTitle, getReferenceSourceParts(reference))
			: failoverTitle,
		// The promise of the resolver counts as well: the fields of a document it asked for are what the
		// caption is missing here, and the own build reached this point without a promise of its own.
		pending: ownTitle.pending ?? resolvedReference?.pending ?? null,
		// A caption the resolver saved is not broken; a raw failover keeps the reason of the own build.
		unresolved: isResolvedByReference ? null : ownTitle.unresolved,
	};
};

function getConditionFieldSourceSignature(connectedBlocks: Block[], object: string, fieldId: string): string
{
	if (object === FIELD_OBJECT_TYPES.DOCUMENT)
	{
		return (diagramStore().documentType ?? []).join(',');
	}

	const source = resolveConditionFieldSource(connectedBlocks, object, fieldId);
	if (source.templateData)
	{
		return source.templateRecord?.Name ?? '';
	}

	const { block, activity, property, isDocumentItem } = source;
	if (!block || !activity)
	{
		return '';
	}

	return [
		activity.Properties?.Title ?? block?.node?.title ?? '',
		property?.Name ?? '',
		Type.isArrayFilled(property?.Default) ? property.Default.join(',') : '',
		// The id of a document picked as a whole is separated by a colon and holds no dot, so the search by
		// the first dotted segment never matches it. Without this the caption would not follow the document
		// property of the source disappearing — and that toggles a raw caption into a warning.
		isDocumentItem ? '1' : '0',
	].join('|');
}

/**
 * Everything a caption is built of, in one string. The captions are rebuilt by a component when this
 * changes, so a renamed source, a renamed constant and a document that has just appeared reach the
 * screen — while the value being typed in the same construction leaves the captions alone. A watcher
 * cannot rely on reading the store inside the caption itself: its handler runs outside of any effect,
 * and the record of the template data it reads there is not tracked as a dependency.
 */
export const getConditionFieldTitleSignature = (
	connectedBlocks: Block[],
	fields: Array<?ConditionExpressionField>,
): string => {
	return (fields ?? [])
		.map((field: ?ConditionExpressionField): string => {
			const object = field?.object ?? '';
			const fieldId = field?.fieldId ?? '';

			return [object, fieldId, getConditionFieldSourceSignature(connectedBlocks, object, fieldId)].join(':');
		})
		.join(';')
	;
};

export function getConditionFieldUnresolvedHint(unresolved: ?string): string
{
	return Loc.getMessage(UNRESOLVED_HINT_KEYS[unresolved] ?? '') ?? '';
}

/**
 * A field of the object `Document` read against a document the node does not address: the caption asked
 * for the fields of the document of the template while the node fixes a type of its own, so the key may
 * well belong to that other document and a field absent from the list read here proves nothing. The
 * caption stays as it is — the accusation goes. A caption built against the very type the node fixed —
 * the editor of a condition of a trigger does exactly that — states a fact about the field and keeps its
 * warning.
 */
function isDocumentReadAgainstOtherType(nodeSettings: ?NodeSettings, documentType: ?Array<string>): boolean
{
	const fixed = getFixedDocumentType(nodeSettings);
	if (!fixed)
	{
		return false;
	}

	const readType = Type.isArrayFilled(documentType) ? documentType : (diagramStore().documentType ?? []);

	return fixed.join(',') !== readType.join(',');
}

/**
 * The reasons that speak of the set of sources rather than of the reference itself. A surface reading a
 * narrower set than the editor of the condition does earns neither of them on its own: the preview card
 * leaves the results of the filters of its own card out of the synthetic source of the node, while the
 * editor, rendered without a card at all, excludes none of them and resolves a reference to them.
 * Template data is read from the template itself and a field of a document from the document of its own
 * property, so no set of blocks can tell those two apart.
 */
const CONTEXT_DEPENDENT_REASONS = new Set([UNRESOLVED_REASONS.SOURCE, UNRESOLVED_REASONS.PROPERTY]);

/**
 * The reason a set of blocks gives for the reference, and only the reasons that set decides: whether the
 * source is there and whether it still publishes the property. Called for a context-dependent reason
 * alone, and the object `Document` carries none of those — it names a document type rather than a source.
 */
function getConditionFieldSourceReason(connectedBlocks: Block[], field: ?ConditionExpressionField): string | null
{
	const object = field?.object ?? '';
	const source = resolveConditionFieldSource(connectedBlocks, object, field?.fieldId ?? '');

	return source.templateData ? null : evaluateBlockConditionFieldTitle(source, object).unresolved;
}

type UnresolvedReasonContext = {
	field: ?ConditionExpressionField,
	nodeSettings: ?NodeSettings,
	// The type of the document the caption of this very field was built against, when the surface reads
	// one of its own rather than the document of the template.
	documentType?: ?Array<string>,
	// The sources of the construction as the editor of the condition reads them, when the surface reads a
	// narrower set of its own: a reason that depends on the set of blocks is then decided there. Nothing
	// to read them from leaves the reason of the surface as it is.
	widerContextBlocks?: ?Block[],
};

/**
 * The reason a surface is allowed to show. All surfaces build a caption by the same rules, and they
 * differ in what they may accuse: a set of sources narrower than the one the condition is edited against
 * explains a missing source by itself, and a document other than the one the node addresses leaves no
 * ground to claim a field of it is gone.
 */
export function getVisibleConditionFieldUnresolvedReason(
	unresolved: ?string,
	{ field, nodeSettings, documentType = null, widerContextBlocks = null }: UnresolvedReasonContext,
): string | null
{
	if (!Type.isStringFilled(unresolved))
	{
		return null;
	}

	if (
		unresolved === UNRESOLVED_REASONS.DOCUMENT_FIELD
		&& field?.object === FIELD_OBJECT_TYPES.DOCUMENT
		&& isDocumentReadAgainstOtherType(nodeSettings, documentType)
	)
	{
		return null;
	}

	// The wider set answers instead of the narrower one rather than merely acquitting it: a source found
	// there may still have lost the property, or a field of the document of that property, and the reason
	// shown must be the one that set gives — including none at all.
	if (CONTEXT_DEPENDENT_REASONS.has(unresolved) && Type.isArrayFilled(widerContextBlocks))
	{
		return getConditionFieldSourceReason(widerContextBlocks, field);
	}

	return unresolved;
}

/**
 * Whether the field of the source document of an action carries a value at all. A reference the panel
 * can resolve to a return property of a connected block is not required: a free expression and an id
 * typed by hand are legitimate values of this field, and only the server can judge them. The
 * resolution itself stays - the effective document type is still read off the referenced property.
 * Whitespace alone is no value: such a field is as empty as it looks.
 */
export const isActionExpressionDocumentCorrect = (
	connectedBlocks: Block[],
	document: string | null,
): boolean => {
	return Type.isStringFilled(document) && document.trim() !== '';
};

function findBlockAndActivityByName(connectedBlocks: Array<Block>, name: string): FoundBlockAndActivity
{
	for (const block: Block of connectedBlocks)
	{
		const { activity } = block;
		if (activity?.Name === name)
		{
			return { block, activity };
		}

		if (!Type.isArrayFilled(activity?.Children))
		{
			continue;
		}

		const childrenActivity = activity.Children.find((child: ActivityData): boolean => {
			return child.Name === name;
		});

		if (childrenActivity)
		{
			return { block, activity: childrenActivity };
		}
	}

	return { block: null, activity: null };
}

function getActivityNameAndFieldIdFromDocumentExpression(documentExpression: string): Array<string>
{
	if (!Type.isStringFilled(documentExpression))
	{
		return [];
	}

	return documentExpression
		.replaceAll(/^{=|}$/g, '')
		.split(':', 2)
	;
}

function extractFieldFromDocumentExpression(
	connectedBlocks: Block[],
	documentExpression: string,
): ExtractedDocumentData
{
	const [activityName: string, fieldId: string] = getActivityNameAndFieldIdFromDocumentExpression(documentExpression);
	if (!Type.isStringFilled(activityName) || !Type.isStringFilled(fieldId))
	{
		return { block: null, activity: null, field: null };
	}

	const { block, activity }: FoundBlockAndActivity = findBlockAndActivityByName(connectedBlocks, activityName);
	if (!activity || !block)
	{
		return { block: null, activity: null, field: null };
	}

	const field = (activity.ReturnProperties ?? []).find((prop: ActivityProperty): boolean => prop.Id === fieldId);
	if (!field)
	{
		return { block: null, activity: null, field: null };
	}

	return {
		block,
		activity,
		field,
	};
}

/**
 * The document type an action is built for, asked for only once the caller has no answer of its own:
 * `resolvePropertyDialogDocumentType` replies with the type fixed on the node before the question
 * reaches here, and only for a whole triplet - a shorter record carries no type at all. So the answer
 * given here is the type published by the referenced return property, and the document of the template
 * for a value no set of blocks can resolve - a free expression or an id typed by hand - otherwise the
 * parameters form could not be built at all. The type of the template is read from the diagram store,
 * its only source of truth, rather than threaded through every caller.
 */
export const evaluateActionExpressionDocumentType = (
	connectedBlocks: Block[],
	documentExpression: string | null,
): Array<string> => {
	const { field }: ExtractedDocumentData = extractFieldFromDocumentExpression(connectedBlocks, documentExpression);
	if (field?.Type === PROPERTY_TYPES.DOCUMENT && Type.isArrayFilled(field.Default))
	{
		return field.Default;
	}

	return diagramStore().documentType ?? [];
};

const ACTIVITY_CONSTRUCTION_TYPES = new Set([
	CONSTRUCTION_TYPES.ACTION,
	CONSTRUCTION_TYPES.FILTER,
]);

// Constructions allowed to read what the node itself publishes. A node runs in a fixed order
// (CBPWorkflow::runExecuteActivityOperation): the filter results are published, then the condition of
// the node is evaluated, and only then executeWithPayload() runs execute() (which publishes the
// ReturnProperties of the node) and after it the children. So the own package of the node exists for
// its actions and for nothing else: offering it to the condition or to the filter would let the user
// build a setting that silently reads an empty value.
const SELF_RETURN_PROPERTIES_CONSTRUCTION_TYPES = new Set([CONSTRUCTION_TYPES.ACTION]);

const siblingBlocksCache: WeakMap<TRuleCard, Map<string, SignatureCachedValue<Block[]>>> = new WeakMap();

function createRuleConstructionBlock(activity: ActivityData): Block
{
	return {
		id: activity.Name,
		node: {
			title: activity.Properties?.Title ?? activity.Name,
		},
		activity,
	};
}

function createSyntheticSourceBlock(currentBlock: Block, filterReturnProperties: ActivityProperty[]): Block
{
	const existingReturnProperties = Type.isArray(currentBlock.activity?.ReturnProperties)
		? [...currentBlock.activity.ReturnProperties]
		: []
	;

	const syntheticIds = new Set(filterReturnProperties.map((property: ActivityProperty): string => property.Id));
	const existingWithoutSynthetic = existingReturnProperties.filter(
		(property: ActivityProperty): boolean => !syntheticIds.has(property.Id),
	);

	return {
		...currentBlock,
		activity: {
			...currentBlock.activity,
			Name: currentBlock.id,
			// The selectors read the title of a source straight off Properties.Title, so a node payload
			// without Properties would break them instead of degrading to a nameless source.
			Properties: Type.isPlainObject(currentBlock.activity?.Properties)
				? currentBlock.activity.Properties
				: { Title: currentBlock.node?.title ?? currentBlock.id },
			ReturnProperties: [...existingWithoutSynthetic, ...filterReturnProperties],
		},
	};
}

/**
 * Whether the own ReturnProperties of the node are a source for the construction being edited.
 *
 * Limited to a node without input ports: the one whose rules live in the reserved portless container.
 * There the ancestors are provably empty (no connection can target that container, so
 * getAllBlockAncestors always answers with an empty list) and the own package of the node is the only
 * source of the document it publishes: for a trigger it is the ReturnDocument its execute() puts in
 * before the children run. A node with input ports is left as it was: whether its own package belongs
 * next to the packages of its ancestors is a separate question, and answering it here would silently
 * change every ordinary node.
 */
function isOwnReturnPropertiesSource(
	currentBlock: Block,
	currentPortId: string | null,
	currentConstruction: Construction | null,
): boolean
{
	return SELF_RETURN_PROPERTIES_CONSTRUCTION_TYPES.has(currentConstruction?.type)
		&& currentPortId === PORTLESS_RULES_KEY
		&& Type.isArrayFilled(currentBlock.activity?.ReturnProperties)
	;
}

function getSyntheticSourceBlock(
	currentBlock: Block,
	currentSettingsItems: Map<string, Rule> | null,
	currentRuleCardId: string | null,
	currentPortId: string | null,
	currentConstruction: Construction | null,
): Block | null
{
	if (!currentBlock)
	{
		return null;
	}

	const filterReturnProperties = collectSyntheticFilterReturnProperties(
		currentSettingsItems,
		currentRuleCardId,
	);

	if (Type.isArrayFilled(filterReturnProperties))
	{
		return createSyntheticSourceBlock(currentBlock, filterReturnProperties);
	}

	// No filter to publish, but the node carries a package of its own: the synthetic block then holds
	// exactly that package (createSyntheticSourceBlock keeps the existing ReturnProperties).
	return isOwnReturnPropertiesSource(currentBlock, currentPortId, currentConstruction)
		? createSyntheticSourceBlock(currentBlock, [])
		: null
	;
}

function getSiblingBlocksSignature(ruleCard: TRuleCard | null, currentConstruction: Construction | null): string
{
	if (!ruleCard || !currentConstruction)
	{
		return '';
	}

	const currentPosition = ruleCard.constructions.findIndex((construction) => construction.id === currentConstruction.id);
	if (currentPosition <= 0)
	{
		return '';
	}

	return ruleCard.constructions
		.slice(0, currentPosition)
		.map((construction: Construction) => {
			return `${construction.id}:${construction.type}:${getActivitySignature(construction.expression?.activityData)}`;
		})
		.join(';');
}

function collectSiblingBlocks(
	ruleCard: TRuleCard | null,
	currentConstruction: Construction | null,
): Block[]
{
	if (!ruleCard || !currentConstruction)
	{
		return [];
	}

	let cache = siblingBlocksCache.get(ruleCard);
	if (!cache)
	{
		cache = new Map();
		siblingBlocksCache.set(ruleCard, cache);
	}

	const cacheKey = currentConstruction.id;
	const signature = getSiblingBlocksSignature(ruleCard, currentConstruction);
	const cachedValue = cache.get(cacheKey);

	if (cachedValue?.signature === signature)
	{
		return cachedValue.value;
	}

	const currentPosition = ruleCard.constructions.findIndex((construction) => construction.id === currentConstruction.id);
	if (currentPosition <= 0)
	{
		cache.set(cacheKey, {
			signature,
			value: [],
		});

		return [];
	}

	const siblingBlocks = ruleCard.constructions
		.slice(0, currentPosition)
		.reduce((acc: Block[], construction: Construction) => {
			if (!ACTIVITY_CONSTRUCTION_TYPES.has(construction.type))
			{
				return acc;
			}

			const activity = construction.expression?.activityData;
			if (!Type.isPlainObject(activity) || !Type.isStringFilled(activity.Name))
			{
				return acc;
			}

			acc.push(createRuleConstructionBlock(activity));

			return acc;
		}, [])
	;

	cache.set(cacheKey, {
		signature,
		value: siblingBlocks,
	});

	return siblingBlocks;
}

/**
 * Transitive ancestors of the port as plain blocks: getAllBlockAncestors() yields
 * `{ block, connections }` entries, while a source context needs the blocks alone. Shared by the
 * context of a construction and by the preview cards, so both judge a source by the same set.
 */
export const getAllAncestorBlocks = (currentBlock: Block, currentPortId: string | null = null): Block[] => {
	return diagramStore().getAllBlockAncestors(currentBlock, currentPortId).reduce(
		(acc: Block[], ancestor): Block[] => {
			const block = Type.isPlainObject(ancestor?.block) ? ancestor.block : ancestor;
			if (Type.isPlainObject(block))
			{
				acc.push(block);
			}

			return acc;
		},
		[],
	);
};

/**
 * The walk over the ancestors depends on the port and on nothing of the construction, so a caller holding
 * several constructions of one port — a preview card does — passes the blocks it has already walked
 * instead of repeating the walk per construction.
 */
export const getConnectedBlocksContextForConstruction = (
	currentBlock: Block,
	currentPortId: string | null,
	ruleCard: TRuleCard | null,
	currentConstruction: Construction | null,
	currentSettingsItems: Map<string, Rule> | null = null,
	portAncestorBlocks: Block[] | null = null,
): ConnectedBlocksContext => {
	const ancestorBlocks = portAncestorBlocks ?? getAllAncestorBlocks(currentBlock, currentPortId);
	const syntheticSourceBlock = getSyntheticSourceBlock(
		currentBlock,
		currentSettingsItems,
		ruleCard?.id ?? null,
		currentPortId,
		currentConstruction,
	);
	const siblingBlocks = collectSiblingBlocks(ruleCard, currentConstruction);
	const allBlocks = syntheticSourceBlock
		? [syntheticSourceBlock, ...siblingBlocks, ...ancestorBlocks]
		: [...siblingBlocks, ...ancestorBlocks]
	;

	return {
		syntheticSourceBlock,
		siblingBlocks,
		ancestorBlocks,
		allBlocks,
	};
};

export const getConnectedBlocksForConstruction = (
	currentBlock: Block,
	currentPortId: string | null,
	ruleCard: TRuleCard | null,
	currentConstruction: Construction | null,
	currentSettingsItems: Map<string, Rule> | null = null,
	portAncestorBlocks: Block[] | null = null,
): Block[] => {
	return getConnectedBlocksContextForConstruction(
		currentBlock,
		currentPortId,
		ruleCard,
		currentConstruction,
		currentSettingsItems,
		portAncestorBlocks,
	).allBlocks;
};
