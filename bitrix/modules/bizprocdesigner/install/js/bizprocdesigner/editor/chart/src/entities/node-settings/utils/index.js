import { Loc, Type } from 'main.core';
import { PROPERTY_TYPES } from '../../../shared/constants';
import type { ActivityData, ActivityProperty, Port, Ports, Block } from '../../../shared/types';
import { diagramStore } from '../../blocks';
import { FIELD_OBJECT_TYPES } from '../constants';
import { type ConditionExpressionField } from '../types';

type FoundBlockAndActivity = {
	block: Block | null,
	activity: ActivityData | null,
};

type ExtractedDocumentData = {
	block: Block,
	activity: ActivityData,
	field: ActivityProperty,
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
