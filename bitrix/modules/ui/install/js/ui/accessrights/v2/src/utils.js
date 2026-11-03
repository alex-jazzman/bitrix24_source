import { ajax as Ajax, Loc, Text, Type } from 'main.core';
import { AirSwitcherStyle } from 'ui.switcher';
import type { AccessRightItem, Variable, VariableCollection } from './store/model/access-rights-model';

export function shouldRowBeRendered(accessRightItem: AccessRightItem): boolean
{
	if (!accessRightItem.isShown)
	{
		return false;
	}

	return !accessRightItem.group || accessRightItem.isGroupExpanded;
}

export function getSelectedVariables(
	variables: VariableCollection,
	selected: Set<string>,
	isAllSelected: boolean,
): VariableCollection
{
	if (isAllSelected)
	{
		return variables;
	}

	const selectedVariables = new Map();

	for (const [variableId, variable] of variables)
	{
		if (selected.has(variableId))
		{
			selectedVariables.set(variableId, variable);
		}
	}

	return selectedVariables;
}

export function isUseGroupHeadValuesInHintByVariables(
	selectedVariables: VariableCollection,
): boolean
{
	return [...selectedVariables].some(([, value]) => value.isUseGroupHeadValuesInHint === true);
}

export function getMultipleSelectedVariablesTitle(selectedVariables: VariableCollection): string
{
	const lastVariable: Variable = [...selectedVariables.values()].pop();

	if (selectedVariables.size === 1)
	{
		return lastVariable.title;
	}

	return Loc.getMessage(
		'JS_UI_ACCESSRIGHTS_V2_HAS_SELECTED_ITEMS',
		{
			'#FIRST_ITEM_NAME#': cutLongTitle(lastVariable.title),
			'#COUNT_REST_ITEMS#': selectedVariables.size - 1,
		},
	);
}

export function cutLongTitle(title: string): string
{
	const VARIABLE_TITLE_MAX_LENGTH = 15;

	if (title.length > VARIABLE_TITLE_MAX_LENGTH)
	{
		return `${title.slice(0, VARIABLE_TITLE_MAX_LENGTH)}...`;
	}

	return title;
}

export function getMultipleSelectedVariablesHintHtml(
	selectedVariables: VariableCollection,
	hintTitle: string,
	allVariables: VariableCollection,
	isInherit: boolean = false,
	restItemsCount: number = 0,
): string
{
	if (!isInherit && !isHintWorthShowing(selectedVariables.size, restItemsCount))
	{
		return '';
	}

	let listItems = '';
	for (const value of makeSortedVariablesArray(selectedVariables, allVariables))
	{
		listItems += `<li>${Text.encode(value.title)}</li>`;
	}

	if (restItemsCount > 0)
	{
		const restItems = Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_HINT_REST_ITEMS', { '#COUNT#': restItemsCount });
		listItems += `<li>${Text.encode(restItems)}</li>`;
	}

	return `
		<p>${Text.encode(hintTitle)}</p>
		<ul>${listItems}</ul>
	`;
}

// a single name is already shown in the cell itself, so the list pays off from the second one
// or when the cell hides values whose names never arrived
function isHintWorthShowing(shownCount: number, restItemsCount: number): boolean
{
	if (shownCount === 0)
	{
		return false;
	}

	return shownCount > 1 || restItemsCount > 0;
}

function makeSortedVariablesArray(toSort: VariableCollection, example: VariableCollection): Variable[]
{
	const orderMap = new Map();

	let index = 0;
	for (const [variableId] of example)
	{
		orderMap.set(variableId, index);

		index++;
	}

	return [...toSort.values()].sort((a, b) => {
		const indexA = orderMap.get(a.id);
		const indexB = orderMap.get(b.id);

		if (Type.isNil(indexA))
		{
			return 1;
		}

		if (Type.isNil(indexB))
		{
			return -1;
		}

		return indexA - indexB;
	});
}

export const DEFAULT_ALIAS_SEPARATOR = '|';

export function parseAliasKey(key: string, separator = DEFAULT_ALIAS_SEPARATOR): Set<string>
{
	const parts = key.split(separator);

	return new Set(parts);
}

export function compileAliasKey(parts: Set<string>, separator = DEFAULT_ALIAS_SEPARATOR): string
{
	const sortedParts = [...parts].sort();

	return sortedParts.join(separator);
}

export function normalizeAliasKey(key: string, separator = DEFAULT_ALIAS_SEPARATOR): string
{
	const parsed = parseAliasKey(key, separator);

	return compileAliasKey(parsed, separator);
}

export function saveSortConfigForAllUserGroups(categoryName: string, sortConfig: Record<string, number>): Promise
{
	return Ajax.runAction('ui.accessrights.setUserSortConfig', {
		data: {
			name: categoryName,
			userSortConfig: sortConfig,
		},
	});
}

// Shared Air-design switcher options (see #8). Pass a size to override the default 'extra-small'.
export function createAirSwitcherOptions(size: string = 'extra-small'): Object
{
	return {
		size,
		useAirDesign: true,
		style: AirSwitcherStyle.SOLID,
	};
}

// Shared hint popup options for the dependent-variables popup (see #7).
export function createHintOptions(text: string): Object
{
	return {
		text,
		popupOptions: {
			bindOptions: {
				position: 'bottom',
			},
			width: 262,
			angle: {
				position: 'top',
				offset: 33,
			},
		},
	};
}