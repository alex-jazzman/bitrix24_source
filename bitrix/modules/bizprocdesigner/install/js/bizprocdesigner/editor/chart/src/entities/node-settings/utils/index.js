import { Loc, Type } from 'main.core';
import { PROPERTY_TYPES } from '../../../shared/constants';
import { type ActivityData, type ActivityProperty, type Port, type Ports, type Block } from '../../../shared/types';
import { diagramStore } from '../../blocks';
import { CONSTRUCTION_TYPES, FIELD_OBJECT_TYPES } from '../constants';
import { type ConditionExpressionField, type ConnectedBlocksContext, type Construction, type TRuleCard, type Rule } from '../types';

type FoundBlockAndActivity = {
	block: Block | null,
	activity: ActivityData | null,
};

type ExtractedDocumentData = {
	block: Block,
	activity: ActivityData,
	field: ActivityProperty,
};

type SignatureCachedValue<T> = {
	signature: string,
	value: T,
};

export const generateNextInputPortId = (ports: Array<Ports>) => {
	const nextPortNumber = ports.reduce(
		(acc, currentValue: Port) => Math.max(acc, parseInt(currentValue.id.slice(1), 10)),
		0,
	) + 1;

	return `i${nextPortNumber}`;
};

export const evaluateConditionExpressionFieldTitle = (
	connectedBlocks: Block[],
	field: ConditionExpressionField,
): string => {
	const store = diagramStore();

	const { object, fieldId } = field;

	const fieldIdParts = fieldId.split('.');
	const fieldIdProperty = fieldIdParts[0] ?? null;
	const makeTitle = (parts: Array<?string>) => (parts.filter(Boolean).join(' / '));

	const failoverTitle = makeTitle([object, fieldId]);

	/** @todo optimize this logic later */
	if (!Object.values(FIELD_OBJECT_TYPES).includes(object))
	{
		const {
			block: foundBlock,
			activity: foundActivity,
		} = findBlockAndActivityByName(connectedBlocks, object);

		if (!foundBlock || !foundActivity)
		{
			return failoverTitle;
		}
		const foundProperty = (foundActivity.ReturnProperties ?? []).find((prop) => prop.Id === fieldIdProperty);
		if (!foundProperty)
		{
			return failoverTitle;
		}

		return makeTitle([
			foundActivity.Properties?.Title ?? foundBlock.node.title,
			foundProperty.Name,
			...fieldIdParts.slice(1),
		]);
	}

	const map = [
		{
			key: 'PARAMETERS',
			idKey: 'Template',
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_PARAMETER_OBJECT'),
		},
		{
			key: 'VARIABLES',
			idKey: 'Variable',
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_VARIABLE_OBJECT'),
		},
		{
			key: 'CONSTANTS',
			idKey: 'Constant',
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_CONSTANT_OBJECT'),
		},
	];

	const foundObject = map.find((elem) => elem.idKey === object);
	if (!foundObject)
	{
		return failoverTitle;
	}

	const fieldName = (store.template[foundObject.key] ?? {})[fieldId]?.Name;
	if (fieldName)
	{
		return makeTitle([foundObject.title, fieldName]);
	}

	return failoverTitle;
};

export const isActionExpressionDocumentCorrect = (
	connectedBlocks: Block[],
	document: string | null,
): boolean => {
	if (!document)
	{
		return false;
	}

	const {
		block,
		activity,
		field,
	}: ExtractedDocumentData = extractFieldFromDocumentExpression(connectedBlocks, document);

	return block && activity && field;
};

export const evaluateActionExpressionDocumentTitle = (
	connectedBlocks: Block[],
	document: string | null,
): string => {
	if (!document)
	{
		return Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
	}

	const {
		block: foundBlock,
		activity: foundActivity,
		field: property,
	}: ExtractedDocumentData = extractFieldFromDocumentExpression(connectedBlocks, document);
	if (!property)
	{
		return Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
	}

	const objectTitle = foundActivity.Properties?.Title ?? foundBlock.node.title;

	return `${property.Name} (${objectTitle})`;
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

export const evaluateActionExpressionDocumentType = (
	connectedBlocks: Block[],
	documentExpression: string | null,
): Array<string> => {
	const { field }: ExtractedDocumentData = extractFieldFromDocumentExpression(connectedBlocks, documentExpression);

	return field?.Type === PROPERTY_TYPES.DOCUMENT && Type.isArrayFilled(field.Default) ? field.Default : [];
};

const ACTIVITY_CONSTRUCTION_TYPES = new Set([
	CONSTRUCTION_TYPES.ACTION,
	CONSTRUCTION_TYPES.FILTER,
]);

const FILTER_DOCUMENT_PROPERTY_ID = 'Document';
const filterReturnPropertiesCache: WeakMap<Map<string, Rule>, Map<string, SignatureCachedValue<ActivityProperty[]>>> = new WeakMap();
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

	return {
		...currentBlock,
		activity: {
			...currentBlock.activity,
			Name: currentBlock.id,
			ReturnProperties: [...existingReturnProperties, ...filterReturnProperties],
		},
	};
}

function createSyntheticFilterReturnProperty(
	activity: ActivityData,
	propertyId: string,
	documentProperty: ActivityProperty,
): ActivityProperty
{
	const filterTitle = Type.isStringFilled(activity.Properties?.Title)
		? activity.Properties.Title
		: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME')
	;

	return {
		...documentProperty,
		Id: propertyId,
		Name: `${documentProperty.Name} (${filterTitle})`,
	};
}

function extractDocumentReturnProperty(activity: ActivityData): ActivityProperty | null
{
	return Type.isArray(activity.ReturnProperties)
		? activity.ReturnProperties.find((property: ActivityProperty): boolean => {
			return property?.Id === FILTER_DOCUMENT_PROPERTY_ID && Type.isArrayFilled(property?.Default);
		})
		: null
	;
}

function getActivitySignature(activity: ActivityData | null): string
{
	if (!Type.isPlainObject(activity))
	{
		return '';
	}

	const documentProperty = extractDocumentReturnProperty(activity);
	const documentDefault = Type.isArrayFilled(documentProperty?.Default)
		? documentProperty.Default.join(',')
		: ''
	;

	return [
		activity.Name ?? '',
		activity.Properties?.Title ?? '',
		documentProperty?.Name ?? '',
		documentDefault,
	].join('|');
}

function collectAllRuleCards(rules: Map<string, Rule>): Array<{ rule: Rule, ruleCard: TRuleCard }>
{
	const result = [];
	for (const rule: Rule of rules.values())
	{
		for (const ruleCard: TRuleCard of (rule?.ruleCards ?? []))
		{
			result.push({ rule, ruleCard });
		}
	}

	return result;
}

export function collectAllConstructions(
	rules: Map<string, Rule>,
): Array<{ rule: Rule, ruleCard: TRuleCard, construction: Construction }>
{
	const result = [];
	for (const { rule, ruleCard } of collectAllRuleCards(rules))
	{
		for (const construction: Construction of (ruleCard?.constructions ?? []))
		{
			result.push({ rule, ruleCard, construction });
		}
	}

	return result;
}

function collectFilterConstructions(
	currentSettingsItems: Map<string, Rule>,
	excludedRuleCardId: string | null,
): Array<{ ruleCard: TRuleCard, construction: Construction }>
{
	return collectAllConstructions(currentSettingsItems).filter((item) => (
		item.ruleCard?.id !== excludedRuleCardId
		&& item.construction?.type === CONSTRUCTION_TYPES.FILTER
	));
}

function getFilterReturnPropertiesSignature(
	currentSettingsItems: Map<string, Rule> | null,
	excludedRuleCardId: string | null,
): string
{
	if (!(currentSettingsItems instanceof Map))
	{
		return '';
	}

	const signature = [];
	for (const { ruleCard, construction } of collectFilterConstructions(currentSettingsItems, excludedRuleCardId))
	{
		signature.push(`${ruleCard.id}:${construction.id}:${getActivitySignature(construction.expression?.activityData)}`);
	}

	return signature.join(';');
}

function collectSyntheticFilterReturnProperties(
	currentSettingsItems: Map<string, Rule> | null,
	excludedRuleCardId: string | null,
): ActivityProperty[]
{
	if (!(currentSettingsItems instanceof Map))
	{
		return [];
	}

	let cache = filterReturnPropertiesCache.get(currentSettingsItems);
	if (!cache)
	{
		cache = new Map();
		filterReturnPropertiesCache.set(currentSettingsItems, cache);
	}

	const cacheKey = excludedRuleCardId ?? '';
	const signature = getFilterReturnPropertiesSignature(currentSettingsItems, excludedRuleCardId);
	const cachedValue = cache.get(cacheKey);

	if (cachedValue?.signature === signature)
	{
		return cachedValue.value;
	}

	const filterReturnProperties = [];
	const seenPropertyIds = new Set();

	for (const { construction } of collectFilterConstructions(currentSettingsItems, excludedRuleCardId))
	{
		const activity = construction.expression?.activityData;
		if (!Type.isPlainObject(activity))
		{
			continue;
		}

		const propertyId = Type.isStringFilled(activity.Name) ? activity.Name : construction.id;
		if (!Type.isStringFilled(propertyId) || seenPropertyIds.has(propertyId))
		{
			continue;
		}

		const documentProperty = extractDocumentReturnProperty(activity);
		if (!documentProperty)
		{
			continue;
		}

		filterReturnProperties.push(createSyntheticFilterReturnProperty(activity, propertyId, documentProperty));
		seenPropertyIds.add(propertyId);
	}

	cache.set(cacheKey, {
		signature,
		value: filterReturnProperties,
	});

	return filterReturnProperties;
}

function getSyntheticSourceBlock(
	currentBlock: Block,
	currentSettingsItems: Map<string, Rule> | null,
	currentRuleCardId: string | null,
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

	return Type.isArrayFilled(filterReturnProperties)
		? createSyntheticSourceBlock(currentBlock, filterReturnProperties)
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

export const getConnectedBlocksContextForConstruction = (
	currentBlock: Block,
	currentPortId: string | null,
	ruleCard: TRuleCard | null,
	currentConstruction: Construction | null,
	currentSettingsItems: Map<string, Rule> | null = null,
): ConnectedBlocksContext => {
	const store = diagramStore();
	const ancestorBlocks = store.getAllBlockAncestors(currentBlock, currentPortId).reduce(
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
	const syntheticSourceBlock = getSyntheticSourceBlock(
		currentBlock,
		currentSettingsItems,
		ruleCard?.id ?? null,
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
): Block[] => {
	return getConnectedBlocksContextForConstruction(
		currentBlock,
		currentPortId,
		ruleCard,
		currentConstruction,
		currentSettingsItems,
	).allBlocks;
};
