import { Loc, Type } from 'main.core';
import type { ActivityData, Port, Ports } from '../../../shared/types';
import { diagramStore } from '../../blocks';
import { FIELD_OBJECT_TYPES } from '../constants';
import { type ConditionExpressionField } from '../types';

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
	const makeTitle = (o: string, f: string) => ([o, f].join(' / '));

	const failoverTitle = makeTitle(object, fieldId);

	/** @todo optimize this logic later */
	if (!Object.values(FIELD_OBJECT_TYPES).includes(object))
	{
		const [foundBlock, foundActivity] = (() => {
			for (const block of connectedBlocks)
			{
				const { activity } = block;
				if (activity?.Name === object)
				{
					return [block, activity];
				}

				if (!Type.isArrayFilled(activity?.Children))
				{
					continue;
				}

				const childrenActivity = activity.Children.find((child: ActivityData) => {
					return child.Name === object;
				});

				if (childrenActivity)
				{
					return [block, childrenActivity];
				}
			}

			return [null, null];
		})();

		if (!foundBlock || !foundActivity)
		{
			return failoverTitle;
		}
		const foundProperty = (foundActivity.ReturnProperties ?? []).find((prop) => prop.Id === fieldId);
		if (!foundProperty)
		{
			return failoverTitle;
		}

		return makeTitle(
			foundActivity.Properties?.Title ?? foundBlock.node.title,
			foundProperty.Name,
		);
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
		return makeTitle(foundObject.title, fieldName);
	}

	return failoverTitle;
};

export const evaluateActionExpressionDocumentTitle = (
	connectedBlocks: Block[],
	document: string | null,
): string => {
	if (!document)
	{
		return Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_DOCUMENT');
	}

	const [object, fieldId] = document
		.replaceAll(/^{=|}$/g, '')
		.split(':')
	;
	if (!Type.isStringFilled(object) || !Type.isStringFilled(fieldId))
	{
		return Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
	}

	const [foundBlock, foundActivity] = (() => {
		for (const block of connectedBlocks)
		{
			const { activity } = block;
			if (activity?.Name === object)
			{
				return [block, activity];
			}

			if (!Type.isArrayFilled(activity?.Children))
			{
				continue;
			}

			const childrenActivity = activity.Children.find((child: ActivityData) => {
				return child.Name === object;
			});

			if (childrenActivity)
			{
				return [block, childrenActivity];
			}
		}

		return [null, null];
	})();
	if (!foundActivity)
	{
		return Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
	}

	const property = (foundActivity.ReturnProperties ?? []).find((prop) => prop.Id === fieldId);
	if (!property)
	{
		return Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
	}

	const objectTitle = foundActivity.Properties?.Title ?? foundBlock.node.title;

	return `${property.Name} (${objectTitle})`;
};
