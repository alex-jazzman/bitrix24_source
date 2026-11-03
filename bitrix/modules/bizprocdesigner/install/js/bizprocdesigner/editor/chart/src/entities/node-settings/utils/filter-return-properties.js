import { Loc, Type } from 'main.core';

import { type ActivityData, type ActivityProperty } from '../../../shared/types';
import { CONSTRUCTION_TYPES } from '../constants';
import { type Construction, type Rule, type TRuleCard } from '../types';

export type SignatureCachedValue<T> = {
	signature: string,
	value: T,
};

const FILTER_DOCUMENT_PROPERTY_ID = 'Document';
const FILTER_RESULT_ALL_SUFFIX = '_all';
const filterReturnPropertiesCache: WeakMap<
	Map<string, Rule>,
	Map<string, SignatureCachedValue<ActivityProperty[]>>
> = new WeakMap();

function createSyntheticFilterReturnProperties(
	activity: ActivityData,
	propertyId: string,
	documentProperty: ActivityProperty,
): ActivityProperty[]
{
	const filterTitle = Type.isStringFilled(activity.Properties?.Title)
		? activity.Properties.Title
		: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME')
	;

	const composeName = (messageId: string): string => Loc.getMessage(messageId, {
		'#DOCUMENT#': Type.isStringFilled(documentProperty.Name) ? documentProperty.Name : propertyId,
		'#FILTER#': filterTitle,
	});

	return [
		{
			...documentProperty,
			Id: propertyId,
			Name: composeName('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_RESULT_FIRST'),
			Multiple: false,
		},
		{
			...documentProperty,
			Id: `${propertyId}${FILTER_RESULT_ALL_SUFFIX}`,
			Name: composeName('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_RESULT_ALL'),
			Multiple: true,
		},
	];
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

/**
 * Entity a filter selects, as its own committed data names it: the document the filter publishes
 * carries the title of the picked entity (EditFilterExpression.buildReturnProperties), so a row can
 * say what the filter works on without asking the server for the metadata of the entity types.
 * Empty while nothing is picked yet.
 */
export function getFilterEntityTitle(construction: Construction | null): string
{
	const activity = construction?.expression?.activityData;
	if (!Type.isPlainObject(activity))
	{
		return '';
	}

	const documentProperty = extractDocumentReturnProperty(activity);

	return Type.isStringFilled(documentProperty?.Name) ? documentProperty.Name : '';
}

export function getActivitySignature(activity: ActivityData | null): string
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

export function collectSyntheticFilterReturnProperties(
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

		filterReturnProperties.push(...createSyntheticFilterReturnProperties(activity, propertyId, documentProperty));
		seenPropertyIds.add(propertyId);
	}

	cache.set(cacheKey, {
		signature,
		value: filterReturnProperties,
	});

	return filterReturnProperties;
}
