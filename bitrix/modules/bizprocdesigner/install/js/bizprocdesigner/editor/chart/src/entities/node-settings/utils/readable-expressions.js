import { Loc, Type } from 'main.core';
import { FeatureCode } from 'bizprocdesigner.feature';

import { useFeature } from '../../../shared/composables/feature';
import { PROPERTY_TYPES } from '../../../shared/constants';
import { type ActivityData, type ActivityProperty, type Block, type DocumentField } from '../../../shared/types';
import {
	documentFieldsCache,
	GLOBAL_FIELD_MODES,
	globalFieldsCache,
	parseSegments,
	presentFormula,
	systemValuesCache,
} from '../../../shared/utils';
import { FILTER_RETURN_PROPERTIES_MAP } from '../../../shared/utils/template-data-provider';
import { diagramStore } from '../../blocks/stores/diagram';
import { useCommonNodeSettingsStore } from '../../common-node-settings/stores/common-node-settings';
import { useNodeSettingsStore } from '../stores/node-settings-store';
import { collectSyntheticFilterReturnProperties } from './filter-return-properties';
import { getFixedDocumentType } from './property-dialog-document-type';

export type ExpressionTextToken = {
	kind: 'text',
	text: string,
};

export type ExpressionRefToken = {
	kind: 'ref',
	raw: string,
	start: number | null,
	end: number | null,
	object: string,
	sourceTitle: string,
	fieldTitle: string,
	path: Array<string>,
	valueType: string | null,
	example: string | null,
	sourceBlockId: string | null,
	isFilterValue: boolean,
	lookupStep: string | null,
	unresolved: string | null,
	fixedRaw: string | null,
};

export type ExpressionToken = ExpressionTextToken | ExpressionRefToken;

type ActivityReturnProperties = {
	properties: Map<string, ActivityProperty>,
	filterPropertyIds: Set<string>,
};

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
	isFilterValue?: boolean,
	lookupStep?: string | null,
	unresolved?: string | null,
	fixedRaw?: string | null,
};

type ResolvedReference = {
	token: ExpressionRefToken,
	pending: Promise<mixed> | null,
};

// A caption of the automation designer resolves into a token or into nothing at all: unlike a
// reference, it names no source of its own and has nothing to keep a broken token for.
type NamedFieldResolution = {
	token: ExpressionRefToken | null,
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

const FORMULA_FUNCTION_LABEL_PREFIX = 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_FUNCTION_';
const FORMULA_FUNCTION_LABEL_KEYS = Object.freeze({
	implode: 'IMPLODE',
	explode: 'EXPLODE',
	merge: 'MERGE',
	shuffle: 'SHUFFLE',
	firstvalue: 'FIRSTVALUE',
	swirl: 'SWIRL',
	numberformat: 'NUMBERFORMAT',
	substr: 'SUBSTR',
	strpos: 'STRPOS',
	strlen: 'STRLEN',
	randstring: 'RANDSTRING',
	strtolower: 'STRTOLOWER',
	strtoupper: 'STRTOUPPER',
	ucwords: 'UCWORDS',
	ucfirst: 'UCFIRST',
	trim: 'TRIM',
	urlencode: 'URLENCODE',
	jsonval: 'JSONVAL',
	abs: 'ABS',
	intval: 'INTVAL',
	floatval: 'FLOATVAL',
	min: 'MIN',
	max: 'MAX',
	rand: 'RAND',
	round: 'ROUND',
	ceil: 'CEIL',
	floor: 'FLOOR',
	true: 'TRUE',
	false: 'FALSE',
	if: 'IF',
	and: 'AND',
	not: 'NOT',
	or: 'OR',
	getdocumenturl: 'GETDOCUMENTURL',
	date: 'DATE',
	dateadd: 'DATEADD',
	datediff: 'DATEDIFF',
	addworkdays: 'ADDWORKDAYS',
	workdateadd: 'WORKDATEADD',
	isworkday: 'ISWORKDAY',
	isworktime: 'ISWORKTIME',
	touserdate: 'TOUSERDATE',
	getuserdateoffset: 'GETUSERDATEOFFSET',
	strtotime: 'STRTOTIME',
	locdate: 'LOCDATE',
	settime: 'SETTIME',
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
const CODE_ONLY_OBJECTS = new Set(['system', 'workflow', 'user']);
// The order is the order the server resolves a caption in, a variable before a constant
// ({@see \Bitrix\Bizproc\Automation\Helper::getExpressionsMaps}).
const GLOBAL_FIELD_MODE_BY_OBJECT = Object.freeze({
	globalvar: GLOBAL_FIELD_MODES.VARIABLE,
	globalconst: GLOBAL_FIELD_MODES.CONSTANT,
});
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
 * Why a reference stayed without a caption. `objectCase` is the odd one out: the value itself is known,
 * only its object name is written in another case, and the server compares that name strictly
 * ({@see \Bitrix\Bizproc\Runtime\Mixins\ActivityRuntimePropertyGetter}).
 */
export const UNRESOLVED_REASONS = Object.freeze({
	SOURCE: 'source',
	PROPERTY: 'property',
	TEMPLATE_DATA: 'templateData',
	DOCUMENT_FIELD: 'documentField',
	OBJECT_CASE: 'objectCase',
});

const UNRESOLVED_HINT_KEYS = Object.freeze({
	[UNRESOLVED_REASONS.SOURCE]: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNRESOLVED_SOURCE',
	[UNRESOLVED_REASONS.PROPERTY]: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNRESOLVED_PROPERTY',
	[UNRESOLVED_REASONS.TEMPLATE_DATA]: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNRESOLVED_TEMPLATE_DATA',
	[UNRESOLVED_REASONS.DOCUMENT_FIELD]: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNRESOLVED_DOCUMENT_FIELD',
	[UNRESOLVED_REASONS.OBJECT_CASE]: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNRESOLVED_OBJECT_CASE',
});

export const FIELD_LOOKUP_STEPS = Object.freeze({
	EXACT: 'exact',
	ALIAS: 'alias',
	NOCASE: 'nocase',
});

const TOKEN_GROUP_CLASSES = Object.freeze({
	inbound: 'bxr-node',
	global: 'bxr-global',
	filter: 'bxr-filter',
	outbound: null,
});

/**
 * A token is painted like the group it belongs to in the data inspector: a preceding node is inbound
 * data, constants and variables of the template are global, results of the filter of the node are the
 * filter group. Own data of the node being edited is outbound, and the document, system variables and
 * parameters have no group of their own there: both keep the neutral colours of the outbound group.
 */
export function tokenSectionClass(token: ExpressionRefToken): string | null
{
	return TOKEN_GROUP_CLASSES[tokenGroup(token)];
}

function tokenGroup(token: ExpressionRefToken): string
{
	if (
		token.sourceBlockId
		&& !useCommonNodeSettingsStore().isCurrentBlock(token.sourceBlockId)
		&& !useNodeSettingsStore().isCurrentBlock(token.sourceBlockId)
	)
	{
		return 'inbound';
	}

	if (GLOBAL_OBJECTS.has(token.object))
	{
		return 'global';
	}

	return token.isFilterValue ? 'filter' : 'outbound';
}

/**
 * A reference broken by colour alone says nothing about what is broken, so every surface tells the
 * reason in words. An unknown reason keeps the caption the feature started with.
 */
export function expressionTokenUnresolvedHint(token: ExpressionRefToken): string | null
{
	if (token.unresolved === null)
	{
		return null;
	}

	const messageId = Object.hasOwn(UNRESOLVED_HINT_KEYS, token.unresolved)
		? UNRESOLVED_HINT_KEYS[token.unresolved]
		: 'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNKNOWN'
	;

	return Loc.getMessage(messageId) ?? Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNKNOWN') ?? '';
}

/**
 * The same reference written in the case the server resolves, or `null` when there is nothing to fix.
 * Only a difference in case counts: the case of the name of the object, which the server compares
 * strictly, and the key of a field of a document found by the `NOCASE` step - the one step that finds
 * the field here and resolves nothing there.
 */
export function expressionTokenFixedReference(token: ExpressionRefToken): string | null
{
	const isCaseMismatch = token.unresolved === UNRESOLVED_REASONS.OBJECT_CASE
		|| token.lookupStep === FIELD_LOOKUP_STEPS.NOCASE
	;

	return isCaseMismatch && Type.isStringFilled(token.fixedRaw) ? token.fixedRaw : null;
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

export function resolveFormulaFunctionLabel(name: string): string | null
{
	const key = String(name ?? '').toLowerCase();
	if (!Object.hasOwn(FORMULA_FUNCTION_LABEL_KEYS, key))
	{
		return null;
	}

	const label = Loc.getMessage(`${FORMULA_FUNCTION_LABEL_PREFIX}${FORMULA_FUNCTION_LABEL_KEYS[key]}`);

	return Type.isStringFilled(label) ? label : null;
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
	if (segments.every((segment) => segment.kind === 'text'))
	{
		return { tokens: segments, hasReference: false, pending: null };
	}

	const sourceBlocks = resolveSourceBlocks(contextBlocks);
	const pendings = [];
	let cursor = 0;
	const tokens = segments.map((segment) => {
		const start = cursor;
		cursor += segment.kind === 'text' || segment.kind === 'formula' ? segment.text.length : segment.raw.length;

		if (segment.kind === 'formula')
		{
			const { token, pending } = createFormulaToken(segment.text, sourceBlocks);
			if (pending)
			{
				pendings.push(pending);
			}

			return { ...token, start, end: cursor };
		}

		if (segment.kind === 'text')
		{
			return segment;
		}

		const { token, pending } = segment.kind === 'name'
			? resolveNamedField(segment)
			: resolveReference(segment, sourceBlocks)
		;

		if (pending)
		{
			pendings.push(pending);
		}

		// A caption of the automation designer matching no known value stays the text it is written as:
		// the catalogs it is looked up in are incomplete, and a plain text in double braces must not be
		// called a broken reference.
		return token ? { ...token, start, end: cursor } : { kind: 'text', text: segment.raw };
	});

	return {
		tokens,
		hasReference: tokens.some((token: ExpressionToken) => token.kind === 'ref'),
		pending: pendings.length > 0 ? Promise.all(pendings).then(() => undefined) : null,
	};
}

/**
 * A value named by its caption: the `{{...}}` notation of the automation designer ({@see
 * \Bitrix\Bizproc\Automation\Helper::unConvertExpressions}). The caption is looked up in the order the
 * server looks it up - the fields of the document, then the global values - and the token it gives is the
 * token of the reference of the value found: the two forms name one and the same value and are told apart
 * by nothing on the screen. A catalog of fields still on its way keeps the global values out of the
 * lookup: a field of the document wins over a global value of the same caption.
 */
function resolveNamedField(segment: { raw: string, name: string }): NamedFieldResolution
{
	const documentField = resolveNamedDocumentField(segment);

	return documentField.token || documentField.pending ? documentField : resolveNamedGlobalField(segment);
}

/**
 * The list of the global values lives nowhere on the page, so a caption matching no field of the document
 * asks for it and the caption is read again once it lands ({@see resolveGlobalField}).
 */
function resolveNamedGlobalField(segment: { raw: string, name: string }): NamedFieldResolution
{
	const documentTypeSigned = nodeDocumentTypeSigned();
	if (!Type.isStringFilled(documentTypeSigned))
	{
		return { token: null, pending: null };
	}

	const pendings = [];

	for (const [objectKey, mode] of Object.entries(GLOBAL_FIELD_MODE_BY_OBJECT))
	{
		const fieldId = globalFieldsCache.findIdByCaption(mode, documentTypeSigned, segment.name);
		if (fieldId !== null)
		{
			const reference = { raw: segment.raw, object: OBJECT_NAMES[objectKey], field: fieldId };

			return resolveGlobalField(reference, objectKey);
		}

		if (!globalFieldsCache.has(mode, documentTypeSigned))
		{
			pendings.push(globalFieldsCache.load(mode, documentTypeSigned));
		}
	}

	return { token: null, pending: pendings.length > 0 ? Promise.all(pendings) : null };
}

function resolveNamedDocumentField(segment: { raw: string, name: string }): NamedFieldResolution
{
	const documentType = nodeDocumentType();
	if (!Type.isArrayFilled(documentType))
	{
		return { token: null, pending: null };
	}

	const cachedFields = documentFieldsCache.get(documentType);
	if (!Type.isArrayFilled(cachedFields))
	{
		return {
			token: null,
			pending: documentFieldsCache.has(documentType) ? null : documentFieldsCache.fetchFields(documentType),
		};
	}

	const field = findNamedDocumentField(cachedFields, segment.name);
	if (!field)
	{
		return { token: null, pending: null };
	}

	const token = createToken({ raw: segment.raw, object: OBJECT_NAMES.document, field: field.fieldKey }, {
		sourceTitle: getSourceTitle(DOCUMENT_OBJECT),
		fieldTitle: field.name,
		valueType: field.type ?? null,
	});

	return { token, pending: null };
}

type DocumentFieldIndex = {
	byKey: Map<string, DocumentField>,
	byLowerKey: Map<string, DocumentField>,
	byAlias: Map<string, DocumentField>,
	byName: Map<string, DocumentField>,
};

/**
 * The lookups of a catalog of fields, built once per catalog. One value of a field holds as many
 * references and captions as its author wrote, and every one of them is looked up in the same catalog the
 * cache of the document fields hands out - a pass over the fields per lookup makes the mount of the veneer
 * the size of the catalog times the size of the text. The catalog is the key of the index itself, so a
 * catalog replaced by a new request is indexed anew and no stale index outlives it.
 */
const documentFieldIndexes: WeakMap<Array<DocumentField>, DocumentFieldIndex> = new WeakMap();

function fieldIndex(fields: Array<DocumentField>): DocumentFieldIndex
{
	const known = documentFieldIndexes.get(fields);
	if (known)
	{
		return known;
	}

	const index: DocumentFieldIndex = {
		byKey: new Map(),
		byLowerKey: new Map(),
		byAlias: new Map(),
		byName: new Map(),
	};

	for (const field: DocumentField of fields)
	{
		index.byKey.set(field.fieldKey, field);
		index.byLowerKey.set(field.fieldKey.toLowerCase(), field);
		if (Type.isStringFilled(field.property?.Alias))
		{
			index.byAlias.set(field.property.Alias, field);
		}

		// The first field of a caption wins, the way a search over the list met it first: two fields of
		// one caption are told apart by nothing written in the value.
		const name = field.name ?? '';
		if (!index.byName.has(name))
		{
			index.byName.set(name, field);
		}
	}

	documentFieldIndexes.set(fields, index);

	return index;
}

/**
 * The field whose caption is written in the value. The server compares the captions exactly
 * ({@see \Bitrix\Bizproc\Automation\Helper::unConvertExpressions}).
 */
export function findDocumentFieldByName(fields: Array<DocumentField>, name: string): DocumentField | null
{
	return fieldIndex(fields).byName.get(name) ?? null;
}

function findNamedDocumentField(fields: Array<DocumentField>, mixed: string): DocumentField | null
{
	const { byName } = fieldIndex(fields);
	let name = '';
	for (const part of mixed.split('>'))
	{
		name += name === '' ? part : `>${part}`;
		const field = byName.get(name.trim());
		if (field)
		{
			return field;
		}
	}

	const trimmed = name.trim();
	if (trimmed.endsWith('_printable'))
	{
		return byName.get(trimmed.slice(0, -'_printable'.length)) ?? null;
	}

	return null;
}

/**
 * The catalog of system values is published into the settings of `bp_selector`, and the page of the
 * node settings panel carries them only for the legacy properties dialog. So a reference that did not
 * match anything known is resolved by what is on hand and hands its load to the `pending` channel -
 * the caller redraws the caption once the catalog lands. A reference already waiting for a request of
 * its own keeps that one: it must redraw by its own answer, not by a slower catalog. The catalog is
 * asked only for the objects it publishes ({@see \Bitrix\Bizproc\Integration\UI\EntitySelector\SystemProvider}).
 */
function resolveReference(
	reference: ExpressionReference,
	blocks: ?Array<Block>,
	documentType: ?Array<string> = null,
): ResolvedReference
{
	const resolvedReference = resolveKnownReference(reference, blocks, documentType);
	const objectKey = String(reference.object ?? '').toLowerCase();
	const mayBeSystemValue = CODE_ONLY_OBJECTS.has(objectKey) || objectKey === 'template';
	if (resolvedReference.pending || systemValuesCache.hasSettled() || !mayBeSystemValue)
	{
		return resolvedReference;
	}

	return { ...resolvedReference, pending: systemValuesCache.load() };
}

/**
 * The document a field of the panel of the node addresses: a node fixing a type of its own - a trigger
 * of another document, an action over a document it was given - publishes it with its settings, and a
 * reference of its fields is resolved against that type rather than against the document of the template
 * ({@see \Bitrix\BizprocDesigner\Internal\Service\Activity\NodeFilterAvailability::resolveEffectiveDocumentType}).
 */
function nodeDocumentType(): ?Array<string>
{
	return getFixedDocumentType(useNodeSettingsStore().nodeSettings) ?? diagramStore().documentType;
}

function nodeDocumentTypeSigned(): ?string
{
	const { nodeSettings } = useNodeSettingsStore();

	return getFixedDocumentType(nodeSettings) === null
		? diagramStore().documentTypeSigned
		: nodeSettings.fixedDocumentTypeSigned;
}

function resolveKnownReference(
	reference: ExpressionReference,
	blocks: ?Array<Block>,
	documentType: ?Array<string> = null,
): ResolvedReference
{
	const objectName = String(reference.object ?? '');
	const objectKey = objectName.toLowerCase();
	const systemValue = systemValuesCache.find(objectName, reference.field);
	const runtimeName = systemValue?.object ?? (Object.hasOwn(OBJECT_NAMES, objectKey) ? OBJECT_NAMES[objectKey] : null);
	const knownObject = (resolvedReference: ResolvedReference): ResolvedReference => {
		return withObjectCase(resolvedReference, runtimeName, objectName);
	};

	if (systemValue)
	{
		return knownObject(resolved(createToken(reference, {
			sourceTitle: getSourceTitle(objectKey === 'template' ? 'system' : objectKey),
			fieldTitle: systemValue.label,
			valueType: systemValue.type,
		})));
	}

	if (runtimeName === null)
	{
		return resolveActivityProperty(reference, blocks);
	}

	if (TEMPLATE_DATA_KEYS[objectKey])
	{
		return knownObject(resolveTemplateProperty(reference, objectKey));
	}

	if (GLOBAL_FIELD_MODE_BY_OBJECT[objectKey])
	{
		return knownObject(resolveGlobalField(reference, objectKey));
	}

	if (CODE_ONLY_OBJECTS.has(objectKey))
	{
		return knownObject(resolved(createToken(reference, { sourceTitle: getSourceTitle(objectKey) })));
	}

	if (RUNTIME_ONLY_OBJECTS.has(objectKey))
	{
		return knownObject(resolved(createToken(reference, { sourceTitle: objectName })));
	}

	if (objectKey === DOCUMENT_OBJECT)
	{
		return knownObject(resolveDocumentField(reference, {
			sourceTitle: getSourceTitle(objectKey),
			documentType: documentType ?? nodeDocumentType(),
			fieldKey: reference.field,
		}));
	}

	return resolveActivityProperty(reference, blocks);
}

/**
 * A known value whose object name is written in another case is shown as it is, and the reason keeps
 * the only thing left to fix. A field found by the `NOCASE` step is the same trouble on the other side of
 * the `:`, so both corrections go into one `fixedRaw` - one press of the button leaves a reference the
 * server resolves. The reason of the field is the one shown: it names the deeper of the two. A value that
 * is broken for a reason the case does not fix keeps that reason and gains no correction.
 */
function withObjectCase(
	resolvedReference: ResolvedReference,
	runtimeName: ?string,
	objectName: string,
): ResolvedReference
{
	const { token } = resolvedReference;
	const isCaseOnly = token.unresolved === null || token.lookupStep === FIELD_LOOKUP_STEPS.NOCASE;
	if (!Type.isStringFilled(runtimeName) || runtimeName === objectName || !isCaseOnly)
	{
		return resolvedReference;
	}

	return {
		...resolvedReference,
		token: {
			...token,
			unresolved: token.unresolved ?? UNRESOLVED_REASONS.OBJECT_CASE,
			fixedRaw: fixReferencePart(token.fixedRaw ?? token.raw, 'object', objectName, runtimeName),
		},
	};
}

/**
 * The list of global values lives nowhere on the page, so the name comes from a lazy cache and the first
 * reference of the text asks for it. The server resolves the id strictly
 * ({@see \Bitrix\Bizproc\Workflow\Type\GlobalsManager::getById}), so a value the list does not carry keeps
 * the code as its caption - a list that could not be read looks the same and must not be called broken.
 */
function resolveGlobalField(reference: ExpressionReference, objectKey: string): ResolvedReference
{
	const sourceTitle = getSourceTitle(objectKey);
	const mode = GLOBAL_FIELD_MODE_BY_OBJECT[objectKey];
	const documentTypeSigned = nodeDocumentTypeSigned();

	if (!Type.isStringFilled(documentTypeSigned))
	{
		return resolved(createToken(reference, { sourceTitle }));
	}

	const field = globalFieldsCache.find(mode, documentTypeSigned, reference.field);
	if (Type.isStringFilled(field?.Name))
	{
		return resolved(createToken(reference, {
			sourceTitle,
			fieldTitle: field.Name,
			valueType: field.Type ?? null,
		}));
	}

	return {
		token: createToken(reference, { sourceTitle }),
		pending: globalFieldsCache.has(mode, documentTypeSigned)
			? null
			: globalFieldsCache.load(mode, documentTypeSigned),
	};
}

function resolveTemplateProperty(reference: ExpressionReference, objectKey: string): ResolvedReference
{
	const sourceTitle = getSourceTitle(objectKey);
	const templateData = diagramStore().template[TEMPLATE_DATA_KEYS[objectKey]] ?? {};
	const property = templateData[reference.field] ?? null;

	if (!Type.isStringFilled(property?.Name))
	{
		return resolved(createToken(reference, {
			sourceTitle,
			unresolved: missingTemplatePropertyReason(objectKey),
		}));
	}

	return resolved(createToken(reference, {
		sourceTitle,
		fieldTitle: property.Name,
		example: toExample(property.Default),
	}));
}

/**
 * `Template:TargetUser` is no parameter of the template: the catalog of system values publishes it
 * ({@see \Bitrix\Bizproc\Integration\UI\EntitySelector\SystemProvider}) and the server answers it
 * whether the template declares the parameter or not ({@see \CBPActivity::getTemplatePropertyType}). So a
 * name the parameters of the template do not carry is called broken only once the catalog is on hand - a
 * catalog that never arrived must not turn a working value into a broken one.
 */
function missingTemplatePropertyReason(objectKey: string): ?string
{
	const mayBeSystemValue = objectKey === 'template' && !systemValuesCache.hasLoaded();

	return mayBeSystemValue ? null : UNRESOLVED_REASONS.TEMPLATE_DATA;
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
	const { properties, filterPropertyIds } = collectActivityReturnProperties(activity);
	const property = properties.get(propertyId);
	if (!property)
	{
		return resolved(createToken(reference, {
			sourceTitle,
			sourceBlockId,
			unresolved: UNRESOLVED_REASONS.PROPERTY,
		}));
	}

	const isFilterValue = filterPropertyIds.has(propertyId);
	const propertyTitle = Type.isStringFilled(property.Name) ? property.Name : propertyId;
	if (tailParts.length === 0)
	{
		return resolved(createToken(reference, {
			sourceTitle,
			sourceBlockId,
			isFilterValue,
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
			isFilterValue,
			documentType: property.Default,
			fieldKey: tailParts.join('.'),
			pathPrefix: [propertyTitle],
		});
	}

	return resolved(createToken(reference, {
		sourceTitle,
		sourceBlockId,
		isFilterValue,
		fieldTitle: tailParts.join('.'),
		path: [sourceTitle, propertyTitle, ...tailParts],
	}));
}

/**
 * The properties a reference of an activity is resolved against, and the ids of those among them the node
 * published as results of its filters ({@see getNodeFilterProperties}) - collected in one pass, because
 * the two answers come off the very same walk and a reader needs both at once.
 */
function collectActivityReturnProperties(activity: ?ActivityData): ActivityReturnProperties
{
	const properties: Map<string, ActivityProperty> = new Map();
	const filterPropertyIds: Set<string> = new Set();

	const returnProperties = activity?.ReturnProperties;
	if (Type.isArray(returnProperties) || Type.isPlainObject(returnProperties))
	{
		for (const property of Object.values(returnProperties))
		{
			if (Type.isPlainObject(property) && Type.isStringFilled(property.Id))
			{
				properties.set(property.Id, property);
			}
		}
	}

	const filterProperties = activity?.Properties?.[FILTER_RETURN_PROPERTIES_MAP];
	if (Type.isPlainObject(filterProperties))
	{
		for (const [propertyId, property] of Object.entries(filterProperties))
		{
			if (Type.isPlainObject(property))
			{
				properties.set(propertyId, { ...properties.get(propertyId), ...property, Id: propertyId });
				filterPropertyIds.add(propertyId);
			}
		}
	}

	for (const property of getLiveFilterReturnProperties(activity))
	{
		properties.set(property.Id, { ...properties.get(property.Id), ...property });
		filterPropertyIds.add(property.Id);
	}

	return { properties, filterPropertyIds };
}

export function getActivityReturnProperties(activity: ?ActivityData): ActivityProperty[]
{
	return [...collectActivityReturnProperties(activity).properties.values()];
}

/**
 * The results of the filters of the node open in the panel, taken off the panel rather than off the
 * block on the canvas: the server declares every filter of the node ({@see
 * \Bitrix\Bizproc\Public\Activity\Mixins\NodeFilterResultProperties::initializeFilterResultPropertiesOf}),
 * so `{=Node:FilterId}` is valid from any card of that node - but the canvas block gains those
 * properties only once the settings are saved, and until then a working reference would read broken.
 */
function getLiveFilterReturnProperties(activity: ?ActivityData): ActivityProperty[]
{
	const activityName = activity?.Name;
	if (!Type.isStringFilled(activityName))
	{
		return [];
	}

	const nodeSettingsStore = useNodeSettingsStore();

	return nodeSettingsStore.isCurrentBlock(activityName)
		? collectSyntheticFilterReturnProperties(nodeSettingsStore.nodeSettings?.rules, null)
		: []
	;
}

function resolveDocumentField(
	reference: ExpressionReference,
	options: {
		sourceTitle: string,
		sourceBlockId?: string | null,
		isFilterValue?: boolean,
		documentType: ?Array<string>,
		fieldKey: string,
		pathPrefix?: Array<string>,
	},
): ResolvedReference
{
	const { sourceTitle, sourceBlockId = null, isFilterValue = false, documentType, fieldKey, pathPrefix = [] } = options;
	const makePath = (leaf: Array<string>): Array<string> => [sourceTitle, ...pathPrefix, ...leaf].filter(Boolean);
	const base = { sourceTitle, sourceBlockId, isFilterValue, fieldTitle: fieldKey, path: makePath([fieldKey]) };

	if (!Type.isArrayFilled(documentType))
	{
		return resolved(createToken(reference, { ...base, unresolved: UNRESOLVED_REASONS.DOCUMENT_FIELD }));
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
		return resolved(createToken(reference, { ...base, unresolved: UNRESOLVED_REASONS.DOCUMENT_FIELD }));
	}

	const leaf = [found.field.name, ...found.tail];
	const foundKey = [found.field.fieldKey, ...found.tail].join('.');

	return resolved(createToken(reference, {
		sourceTitle,
		sourceBlockId,
		isFilterValue,
		lookupStep: found.step,
		fieldTitle: leaf.join(TOKEN_PATH_SEPARATOR),
		path: makePath(leaf),
		valueType: found.tail.length === 0 ? found.field.type ?? null : null,
		unresolved: found.step === FIELD_LOOKUP_STEPS.NOCASE ? UNRESOLVED_REASONS.DOCUMENT_FIELD : null,
		fixedRaw: found.step === FIELD_LOOKUP_STEPS.NOCASE
			? fixReferencePart(referenceRaw(reference), 'field', fieldKey, foundKey)
			: null,
	}));
}

/**
 * The steps the server takes to resolve a field of a document
 * ({@see \Bitrix\Bizproc\Runtime\Mixins\ActivityRuntimePropertyGetter::getRuntimeDocumentField}): the whole
 * key, then the aliases of the fields - both taken as a whole, the map of the aliases holds no dotted key
 * of its own ({@see \CBPDocument::getDocumentFieldsAliasesMap}) - and only then the same key in another case.
 *
 * The tail of a dotted key is cut against the keys of the fields alone: the fields of a document hold
 * `ASSIGNED_BY_ID` and know nothing of `ASSIGNED_BY_ID.NAME`, whose tail is a modifier the value of the
 * field is read with, and the longest prefix that did match wins - a whole segment of a composite key is
 * often no field of its own. An alias with a tail is nobody's field, neither here nor there.
 *
 * The step that did match is the answer of its own: `NOCASE` is the one case where the field is found here
 * but the server, comparing keys strictly, resolves nothing.
 */
export function findDocumentField(
	fields: Array<DocumentField>,
	fieldKey: string,
): ?{ field: DocumentField, tail: Array<string>, step: string }
{
	const { byKey, byAlias, byLowerKey } = fieldIndex(fields);

	const exact = byKey.get(fieldKey);
	if (exact)
	{
		return { field: exact, tail: [], step: FIELD_LOOKUP_STEPS.EXACT };
	}

	const aliased = byAlias.get(fieldKey);
	if (aliased)
	{
		return { field: aliased, tail: [], step: FIELD_LOOKUP_STEPS.ALIAS };
	}

	const prefixed = findFieldByPrefix(byKey, fieldKey, fieldKey);
	if (prefixed)
	{
		return { ...prefixed, step: FIELD_LOOKUP_STEPS.EXACT };
	}

	const nocase = findFieldByPrefix(byLowerKey, fieldKey.toLowerCase(), fieldKey);
	if (nocase)
	{
		return { ...nocase, step: FIELD_LOOKUP_STEPS.NOCASE };
	}

	return null;
}

function findFieldByPrefix(
	fieldsByKey: Map<string, DocumentField>,
	lookupKey: string,
	fieldKey: string,
): ?{ field: DocumentField, tail: Array<string> }
{
	let prefixKey = lookupKey;
	while (prefixKey !== '')
	{
		const field = fieldsByKey.get(prefixKey);
		if (field)
		{
			const tail = fieldKey.slice(prefixKey.length + 1);

			return { field, tail: tail === '' ? [] : tail.split('.') };
		}

		prefixKey = prefixKey.slice(0, Math.max(prefixKey.lastIndexOf('.'), 0));
	}

	return null;
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

function referenceRaw(reference: ExpressionReference): string
{
	return reference.raw ?? `{=${reference.object}:${reference.field}}`;
}

/**
 * The text of a reference is patched, not rebuilt: it keeps the spacing and the modifiers written after
 * `>`, and only the part written in the wrong case changes. The first `:` of the text always separates
 * the object from the field: a colon of a modifier can only come after it.
 */
function fixReferencePart(raw: string, part: 'object' | 'field', from: string, to: string): string
{
	const separator = raw.indexOf(':');
	if (separator === -1)
	{
		return raw;
	}

	const object = raw.slice(0, separator);
	const field = raw.slice(separator + 1);

	return part === 'object'
		? `${replaceFirst(object, from, to)}:${field}`
		: `${object}:${replaceFirst(field, from, to)}`;
}

function replaceFirst(text: string, from: string, to: string): string
{
	const at = text.indexOf(from);

	return at === -1 ? text : text.slice(0, at) + to + text.slice(at + from.length);
}

function createToken(reference: ExpressionReference, data: TokenData): ExpressionRefToken
{
	const sourceTitle = data.sourceTitle ?? '';
	const fieldTitle = data.fieldTitle ?? reference.field;

	return {
		kind: 'ref',
		raw: referenceRaw(reference),
		start: null,
		end: null,
		object: String(reference.object ?? '').toLowerCase(),
		sourceTitle,
		fieldTitle,
		path: data.path ?? [sourceTitle, fieldTitle].filter(Boolean),
		valueType: data.valueType ?? null,
		example: data.example ?? null,
		sourceBlockId: data.sourceBlockId ?? null,
		isFilterValue: data.isFilterValue === true,
		lookupStep: data.lookupStep ?? null,
		unresolved: data.unresolved ?? null,
		fixedRaw: data.fixedRaw ?? null,
	};
}

function createUnknownToken(reference: ExpressionReference): ExpressionRefToken
{
	return createToken(reference, { sourceTitle: reference.object, unresolved: UNRESOLVED_REASONS.SOURCE });
}

function createFormulaToken(text: string, blocks: Array<Block>): ResolvedReference
{
	const presentation = presentFormula(text, {
		fallbackLabel: Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_FORMULA') ?? '',
		decimalSeparator: formulaDecimalSeparator(),
		resolveReference: (reference) => {
			const { token, pending } = resolveReference(reference, blocks);

			return {
				label: token.fieldTitle || token.raw,
				unresolved: token.unresolved,
				pending,
			};
		},
		resolveName: (segment) => {
			const { token, pending } = segment.kind === 'ref'
				? resolveReference(segment, blocks)
				: resolveNamedField(segment)
			;

			return {
				label: token ? (token.fieldTitle || token.raw) : segment.raw,
				unresolved: token?.unresolved ?? null,
				pending,
			};
		},
		resolveFunctionLabel: resolveFormulaFunctionLabel,
	});

	return {
		token: createToken({ raw: text, object: '', field: presentation.label }, {
			unresolved: presentation.unresolved,
		}),
		pending: presentation.pendings.length > 0
			? Promise.all(presentation.pendings).then(() => undefined)
			: null,
	};
}

function formulaDecimalSeparator(): string
{
	try
	{
		const currentLang = Type.isFunction(Loc.getCurrentLang)
			? Loc.getCurrentLang()
			: Loc.getMessage('LANGUAGE_ID')
		;
		const decimal = new Intl.NumberFormat(Type.isStringFilled(currentLang) ? currentLang : undefined)
			.formatToParts(1.1)
			.find((part) => part.type === 'decimal')
		;

		return Type.isStringFilled(decimal?.value) ? decimal.value : '.';
	}
	catch
	{
		return '.';
	}
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
