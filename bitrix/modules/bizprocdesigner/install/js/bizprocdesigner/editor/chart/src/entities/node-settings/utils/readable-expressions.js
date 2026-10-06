import { Loc, Type } from 'main.core';
import { FeatureCode } from 'bizprocdesigner.feature';

import { useFeature } from '../../../shared/composables/feature';
import { PROPERTY_TYPES, SYSTEM_VARIABLES } from '../../../shared/constants';
import { type ActivityData, type ActivityProperty, type Block, type DocumentField } from '../../../shared/types';
import { documentFieldsCache, parseSegments } from '../../../shared/utils';
import { diagramStore } from '../../blocks/stores/diagram';
import { useCommonNodeSettingsStore } from '../../common-node-settings/stores/common-node-settings';

export type ExpressionTextToken = {
	kind: 'text',
	text: string,
};

export type ExpressionRefToken = {
	kind: 'ref',
	raw: string,
	object: string,
	sourceTitle: string,
	fieldTitle: string,
	path: Array<string>,
	valueType: string | null,
	example: string | null,
	sourceBlockId: string | null,
	unknown: boolean,
};

export type ExpressionToken = ExpressionTextToken | ExpressionRefToken;

export type ExpressionTokens = {
	tokens: Array<ExpressionToken>,
	hasReference: boolean,
	pending: Promise<void> | null,
};

type ExpressionReference = {
	raw?: string,
	object: string,
	field: string,
};

type TokenData = {
	sourceTitle?: string,
	fieldTitle?: string,
	path?: Array<string>,
	valueType?: string | null,
	example?: string | null,
	sourceBlockId?: string | null,
	unknown?: boolean,
};

type ResolvedReference = {
	token: ExpressionRefToken,
	pending: Promise<mixed> | null,
};

const SOURCE_LABEL_KEYS = Object.freeze({
	document: 'BIZPROCDESIGNER_EDITOR_DOCUMENT',
	variable: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_VARIABLE_OBJECT',
	constant: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_CONSTANT_OBJECT',
	template: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_PARAMETER_OBJECT',
	parameter: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_PARAMETER_OBJECT',
	system: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_SOURCE_SYSTEM',
	workflow: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_SOURCE_WORKFLOW',
	user: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_SOURCE_USER',
	globalconst: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_SOURCE_GLOBAL_CONST',
	globalvar: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_SOURCE_GLOBAL_VAR',
});

const TEMPLATE_DATA_KEYS = Object.freeze({
	variable: 'VARIABLES',
	constant: 'CONSTANTS',
	template: 'PARAMETERS',
	parameter: 'PARAMETERS',
});

export const TOKEN_PATH_SEPARATOR = ' → ';

const DOCUMENT_OBJECT = 'document';
const GLOBAL_OBJECTS = new Set(['constant', 'variable', 'globalconst', 'globalvar']);
const CODE_ONLY_OBJECTS = new Set(['system', 'workflow', 'user', 'globalconst', 'globalvar']);
const RUNTIME_ONLY_OBJECTS = new Set(['input']);
export const OBJECT_NAMES = Object.freeze({
	document: 'Document',
	variable: 'Variable',
	constant: 'Constant',
	template: 'Template',
	parameter: 'Parameter',
	system: 'System',
	workflow: 'Workflow',
	user: 'User',
	globalconst: 'GlobalConst',
	globalvar: 'GlobalVar',
	input: 'Input',
});

/**
 * A token is painted like the group it belongs to in the data inspector: a preceding node is inbound
 * data, constants and variables of the template are global. Own data of the node being edited is
 * outbound, and the document, system variables and parameters have no group of their own there — both
 * keep the neutral colours of the outbound group.
 */
export function tokenSectionClass(token: ExpressionRefToken): string | null
{
	if (token.sourceBlockId)
	{
		return useCommonNodeSettingsStore().isCurrentBlock(token.sourceBlockId) ? null : 'bxr-node';
	}

	return GLOBAL_OBJECTS.has(token.object) ? 'bxr-global' : null;
}

/**
 * Readable caption of a token, shared by the veneer, the read-only preview and the popover.
 * A reference left without both titles falls back to its own code: an empty caption would leave the
 * token of the veneer — a control of its own — without an accessible name.
 */
export function expressionTokenLabel(token: ExpressionRefToken): string
{
	return [token.sourceTitle, token.fieldTitle].filter(Boolean).join(TOKEN_PATH_SEPARATOR) || token.raw;
}

export function isReadableExpressionsAvailable(): boolean
{
	return useFeature().isFeatureAvailable(FeatureCode.readableExpressions);
}

export function resolveExpressionReference(
	reference: ExpressionReference,
	blocks: ?Array<Block> = null,
	documentType: ?Array<string> = null,
): ExpressionRefToken | null
{
	if (!isReadableExpressionsAvailable())
	{
		return null;
	}

	return resolveReference(reference, blocks ?? diagramStore().blocks, documentType).token;
}

/**
 * The token of a reference together with the promise of the fields of a document still on their way.
 * A caller that renders a caption once and rebuilds it when the fields arrive needs both halves, and
 * `resolveExpressionReference()` keeps only the token.
 */
export function resolveExpressionReferenceWithPending(
	reference: ExpressionReference,
	blocks: ?Array<Block> = null,
	documentType: ?Array<string> = null,
): ResolvedReference | null
{
	if (!isReadableExpressionsAvailable())
	{
		return null;
	}

	return resolveReference(reference, blocks ?? diagramStore().blocks, documentType);
}

/**
 * Blocks of the context of the field — the synthetic source of the rule card and its siblings — are
 * not on the diagram, so they are looked up in addition to its blocks and before them: a reference
 * of a rule card resolves through its own context, everything else through the diagram as before.
 */
function resolveSourceBlocks(contextBlocks: ?Array<Block>): Array<Block>
{
	const blocks = diagramStore().blocks;

	return contextBlocks ? [...contextBlocks, ...blocks] : blocks;
}

export function isSourceBlockOnDiagram(blockId: ?string): boolean
{
	return Type.isStringFilled(blockId) && diagramStore().blocks.some((block: Block) => block.id === blockId);
}

export function buildExpressionTokens(value: string, contextBlocks: ?Array<Block> = null): ExpressionTokens
{
	if (!isReadableExpressionsAvailable())
	{
		return {
			tokens: Type.isStringFilled(value) ? [{ kind: 'text', text: value }] : [],
			hasReference: false,
			pending: null,
		};
	}

	const segments = parseSegments(value);
	if (!segments.some((segment) => segment.kind === 'ref'))
	{
		return { tokens: segments, hasReference: false, pending: null };
	}

	const sourceBlocks = resolveSourceBlocks(contextBlocks);
	const pendings = [];
	const tokens = segments.map((segment) => {
		if (segment.kind !== 'ref')
		{
			return segment;
		}

		const { token, pending } = resolveReference(segment, sourceBlocks);
		if (pending)
		{
			pendings.push(pending);
		}

		return token;
	});

	return {
		tokens,
		hasReference: true,
		pending: pendings.length > 0 ? Promise.all(pendings).then(() => undefined) : null,
	};
}

function resolveReference(
	reference: ExpressionReference,
	blocks: ?Array<Block>,
	documentType: ?Array<string> = null,
): ResolvedReference
{
	const objectName = String(reference.object ?? '');
	const objectKey = objectName.toLowerCase();
	const hasRuntimeObjectName = OBJECT_NAMES[objectKey] === objectName;

	const systemVariable = SYSTEM_VARIABLES.find((variable) => {
		return variable.object === objectName && variable.field === reference.field;
	});
	if (systemVariable)
	{
		return resolved(createToken(reference, {
			sourceTitle: getSourceTitle(objectKey === 'template' ? 'system' : objectKey),
			fieldTitle: Loc.getMessage(systemVariable.labelKey) ?? '',
			valueType: systemVariable.type,
		}));
	}

	if (hasRuntimeObjectName && TEMPLATE_DATA_KEYS[objectKey])
	{
		return resolveTemplateProperty(reference, objectKey);
	}

	if (hasRuntimeObjectName && CODE_ONLY_OBJECTS.has(objectKey))
	{
		return resolved(createToken(reference, { sourceTitle: getSourceTitle(objectKey) }));
	}

	if (hasRuntimeObjectName && RUNTIME_ONLY_OBJECTS.has(objectKey))
	{
		return resolved(createToken(reference, { sourceTitle: objectName }));
	}

	if (hasRuntimeObjectName && objectKey === DOCUMENT_OBJECT)
	{
		return resolveDocumentField(reference, {
			sourceTitle: getSourceTitle(objectKey),
			documentType: documentType ?? diagramStore().documentType,
			fieldKey: reference.field,
		});
	}

	return resolveActivityProperty(reference, blocks);
}

function resolveTemplateProperty(reference: ExpressionReference, objectKey: string): ResolvedReference
{
	const sourceTitle = getSourceTitle(objectKey);
	const templateData = diagramStore().template[TEMPLATE_DATA_KEYS[objectKey]] ?? {};
	const property = templateData[reference.field] ?? null;

	if (!Type.isStringFilled(property?.Name))
	{
		return resolved(createToken(reference, { sourceTitle, unknown: true }));
	}

	return resolved(createToken(reference, {
		sourceTitle,
		fieldTitle: property.Name,
		example: toExample(property.Default),
	}));
}

function resolveActivityProperty(reference: ExpressionReference, blocks: ?Array<Block>): ResolvedReference
{
	const found = findBlockAndActivity(blocks, reference.object);
	if (!found)
	{
		return resolved(createUnknownToken(reference));
	}

	const { block, activity } = found;
	const sourceTitle = activity.Properties?.Title ?? block.node?.title ?? '';
	const sourceBlockId = block.id ?? null;

	const [propertyId, ...tailParts] = reference.field.split('.');
	const property = (activity.ReturnProperties ?? []).find((item: ActivityProperty) => item.Id === propertyId);
	if (!property)
	{
		return resolved(createToken(reference, { sourceTitle, sourceBlockId, unknown: true }));
	}

	const propertyTitle = Type.isStringFilled(property.Name) ? property.Name : propertyId;
	if (tailParts.length === 0)
	{
		return resolved(createToken(reference, {
			sourceTitle,
			sourceBlockId,
			fieldTitle: propertyTitle,
			valueType: property.Type ?? null,
			example: toExample(property.Default),
		}));
	}

	if (property.Type === PROPERTY_TYPES.DOCUMENT && Type.isArrayFilled(property.Default))
	{
		return resolveDocumentField(reference, {
			sourceTitle,
			sourceBlockId,
			documentType: property.Default,
			fieldKey: tailParts.join('.'),
			pathPrefix: [propertyTitle],
		});
	}

	return resolved(createToken(reference, {
		sourceTitle,
		sourceBlockId,
		fieldTitle: tailParts.join('.'),
		path: [sourceTitle, propertyTitle, ...tailParts],
	}));
}

function resolveDocumentField(
	reference: ExpressionReference,
	options: {
		sourceTitle: string,
		sourceBlockId?: string | null,
		documentType: ?Array<string>,
		fieldKey: string,
		pathPrefix?: Array<string>,
	},
): ResolvedReference
{
	const { sourceTitle, sourceBlockId = null, documentType, fieldKey, pathPrefix = [] } = options;
	const makePath = (leaf: Array<string>): Array<string> => [sourceTitle, ...pathPrefix, ...leaf].filter(Boolean);
	const base = { sourceTitle, sourceBlockId, fieldTitle: fieldKey, path: makePath([fieldKey]) };

	if (!Type.isArrayFilled(documentType))
	{
		return resolved(createToken(reference, { ...base, unknown: true }));
	}

	// An empty list is not an answer: that is what a failed request leaves in the cache, and a
	// reference called broken over a network failure would stay broken until the page is reloaded.
	const cachedFields = documentFieldsCache.get(documentType);
	if (!Type.isArrayFilled(cachedFields))
	{
		return {
			token: createToken(reference, base),
			pending: documentFieldsCache.has(documentType) ? null : documentFieldsCache.fetchFields(documentType),
		};
	}

	const found = findDocumentField(cachedFields, fieldKey);
	if (!found)
	{
		return resolved(createToken(reference, { ...base, unknown: true }));
	}

	const leaf = [found.field.name, ...found.tail];

	return resolved(createToken(reference, {
		sourceTitle,
		sourceBlockId,
		fieldTitle: leaf.join(TOKEN_PATH_SEPARATOR),
		path: makePath(leaf),
		valueType: found.tail.length === 0 ? found.field.type ?? null : null,
	}));
}

/**
 * A dotted key is looked up whole first and then by its first part: the fields of a document hold
 * `ASSIGNED_BY_ID` and know nothing of `ASSIGNED_BY_ID.NAME`, whose tail is a modifier of the field.
 */
function findDocumentField(
	fields: Array<DocumentField>,
	fieldKey: string,
): ?{ field: DocumentField, tail: Array<string> }
{
	const exact = fields.find((field: DocumentField) => field.fieldKey === fieldKey);
	if (exact)
	{
		return { field: exact, tail: [] };
	}

	const [baseKey, ...tail] = fieldKey.split('.');
	const baseField = tail.length > 0
		? fields.find((field: DocumentField) => field.fieldKey === baseKey)
		: null
	;

	return baseField ? { field: baseField, tail } : null;
}

function findBlockAndActivity(blocks: ?Array<Block>, name: string): ?{ block: Block, activity: ActivityData }
{
	for (const block: Block of (blocks ?? []))
	{
		const activity = findActivityInTree(block.activity, name);
		if (activity)
		{
			return { block, activity };
		}
	}

	return null;
}

function findActivityInTree(activity: ?ActivityData, name: string): ?ActivityData
{
	if (!Type.isPlainObject(activity))
	{
		return null;
	}

	if (activity.Name === name)
	{
		return activity;
	}

	for (const child: ActivityData of (Type.isArray(activity.Children) ? activity.Children : []))
	{
		const found = findActivityInTree(child, name);
		if (found)
		{
			return found;
		}
	}

	return null;
}

function getSourceTitle(objectKey: string): string
{
	return Loc.getMessage(SOURCE_LABEL_KEYS[objectKey]) ?? '';
}

function createToken(reference: ExpressionReference, data: TokenData): ExpressionRefToken
{
	const sourceTitle = data.sourceTitle ?? '';
	const fieldTitle = data.fieldTitle ?? reference.field;

	return {
		kind: 'ref',
		raw: reference.raw ?? `{=${reference.object}:${reference.field}}`,
		object: String(reference.object ?? '').toLowerCase(),
		sourceTitle,
		fieldTitle,
		path: data.path ?? [sourceTitle, fieldTitle].filter(Boolean),
		valueType: data.valueType ?? null,
		example: data.example ?? null,
		sourceBlockId: data.sourceBlockId ?? null,
		unknown: data.unknown === true,
	};
}

function createUnknownToken(reference: ExpressionReference): ExpressionRefToken
{
	return createToken(reference, { sourceTitle: reference.object, unknown: true });
}

function resolved(token: ExpressionRefToken): ResolvedReference
{
	return { token, pending: null };
}

function toExample(value: mixed): string | null
{
	if (Type.isStringFilled(value))
	{
		return value;
	}

	return Type.isNumber(value) ? String(value) : null;
}
