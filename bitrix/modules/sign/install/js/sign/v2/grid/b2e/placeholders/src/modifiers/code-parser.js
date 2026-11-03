/**
 * Reading a stored code back into the set of modifiers it was assembled from: the exact reverse of
 * `assembledCode`, so a code the panel wrote is always understood, and a code it could not have
 * written is refused instead of guessed.
 *
 * Pure functions over the catalog: no Vue, no DOM, no network.
 */

import { modifierCatalog } from './catalog';
import { orderGroups } from './group-order';
import type { RankedField } from './group-order';
import type { ModifierGroup, ModifierSelection, ModifierVariant } from './types';

/** A stored code taken apart: the code of the field itself and what the tilde carries after it. */
export type StoredCode = {
	baseCode: string,
	tail: string,
};

type VariantMatch = {
	variant: ModifierVariant,
	parameters: string,
};

export const splitStoredCode = (storedCode: string): StoredCode => {
	const tildePosition = storedCode.indexOf('~');
	if (tildePosition === -1)
	{
		return { baseCode: storedCode, tail: '' };
	}

	return {
		baseCode: storedCode.slice(0, tildePosition),
		tail: storedCode.slice(tildePosition + 1),
	};
};

/**
 * The parameters of a variant stand at the head of what is left: either they are all of it, or a
 * comma of the assembly follows them. A comma inside a single parameter value is no separator, so
 * the tail is never split by commas - it is eaten by the very strings the catalog holds.
 */
const startsWithParameters = (remaining: string, parameters: string): boolean => {
	return remaining === parameters || remaining.startsWith(`${parameters},`);
};

/**
 * The longest of the variants standing at the head wins: a variant whose value carries a comma has a
 * shorter one of the same group inside it (`j F Y, H:i` holds `j F Y`), and only the longer reading
 * leaves the rest of the tail explainable.
 */
const matchVariant = (group: ModifierGroup, remaining: string): VariantMatch | null => {
	let matched: VariantMatch | null = null;

	for (const variant of group.variants)
	{
		if (variant.parameters.length === 0)
		{
			continue;
		}

		const parameters = variant.parameters.join(',');
		if (startsWithParameters(remaining, parameters) && parameters.length > (matched?.parameters.length ?? 0))
		{
			matched = { variant, parameters };
		}
	}

	return matched;
};

/**
 * Groups are walked in catalog order, the very order the assembly writes them in, and every match
 * eats its own parameters off the head of the tail. A tail left unexplained - an unknown parameter,
 * an order the assembly never produces, an exclusive variant standing next to another group - is no
 * set of the catalog and comes back as `null`.
 */
export const parseParameters = (tail: string): ModifierSelection | null => {
	if (tail === '')
	{
		return null;
	}

	const selection: ModifierSelection = {};
	let remaining = tail;

	for (const group of modifierCatalog.groups)
	{
		const matched = matchVariant(group, remaining);
		if (!matched)
		{
			continue;
		}

		// An exclusive variant leaves nothing but itself in the assembled code, so it answers for the
		// whole tail or the reading is wrong.
		if (matched.variant.exclusive)
		{
			return matched.parameters === tail ? { [group.id]: matched.variant } : null;
		}

		selection[group.id] = matched.variant;
		remaining = remaining.slice(matched.parameters.length);
		if (remaining === '')
		{
			break;
		}

		// The match ended on a separator of the assembly, and a separator carries another parameter.
		remaining = remaining.slice(1);
		if (remaining === '')
		{
			return null;
		}
	}

	return remaining === '' ? selection : null;
};

/**
 * The set the row is drawn with. The type of the field could have changed since the code reached the
 * history, so every restored group is asked for again - a group the field is no longer offered takes
 * the whole set with it: showing a state we cannot explain is worse than showing none.
 */
export const restoreSelection = (tail: string, field: RankedField, region: string): ModifierSelection => {
	const selection = parseParameters(tail);
	if (selection === null)
	{
		return {};
	}

	const offeredGroupIds = orderGroups(field, region).map((group: ModifierGroup) => group.id);

	return Object.keys(selection).every((groupId: string) => offeredGroupIds.includes(groupId))
		? selection
		: {}
	;
};
