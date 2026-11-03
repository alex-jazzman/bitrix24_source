/**
 * Assembling the symbolic code from a chosen set of modifiers and switching the choice inside a group.
 *
 * Pure functions over the catalog: no Vue, no DOM, no network.
 */

import { modifierCatalog } from './catalog';
import type {
	ModifierGroup,
	ModifierGroupId,
	ModifierSelection,
	ModifierVariant,
} from './types';

const groupIdsOf = (selection: ModifierSelection): ModifierGroupId[] => {
	return Object.keys(selection);
};

const withoutExclusive = (selection: ModifierSelection): ModifierSelection => {
	const next: ModifierSelection = {};

	groupIdsOf(selection).forEach((groupId: ModifierGroupId) => {
		const variant = selection[groupId];
		if (variant && !variant.exclusive)
		{
			next[groupId] = variant;
		}
	});

	return next;
};

/**
 * Parameter strings of the chosen set, in catalog order: what the assembled code carries after the
 * tilde. An exclusive variant leaves nothing but itself.
 */
export const selectionParameters = (selection: ModifierSelection): string[] => {
	const parameters: string[] = [];

	for (const group of modifierCatalog.groups)
	{
		const variant = selection[group.id];
		if (!variant || variant.parameters.length === 0)
		{
			continue;
		}

		if (variant.exclusive)
		{
			return [...variant.parameters];
		}

		parameters.push(...variant.parameters);
	}

	return parameters;
};

/**
 * The code of the field together with the chosen set, the way the history stores it. Parameters of
 * different groups and several parameters of one variant are joined by a comma on the same level, so
 * the result never holds more than one tilde.
 */
export const assembledCode = (baseCode: string, selection: ModifierSelection): string => {
	const parameters = selectionParameters(selection);

	return parameters.length === 0 ? baseCode : `${baseCode}~${parameters.join(',')}`;
};

/** The same code wrapped for the clipboard: the braces belong to the copy and to nothing else. */
export const buildCode = (baseCode: string, selection: ModifierSelection): string => {
	return `{${assembledCode(baseCode, selection)}}`;
};

/** Switches the choice inside a group: the base variant resets it, an exclusive one drops the rest. */
export const toggle = (
	selection: ModifierSelection,
	group: ModifierGroup,
	variant: ModifierVariant,
): ModifierSelection => {
	if (variant.parameters.length === 0)
	{
		const next: ModifierSelection = { ...selection };
		delete next[group.id];

		return next;
	}

	if (variant.exclusive)
	{
		const exclusiveOnly: ModifierSelection = {};
		exclusiveOnly[group.id] = variant;

		return exclusiveOnly;
	}

	const next: ModifierSelection = withoutExclusive(selection);
	next[group.id] = variant;

	return next;
};
