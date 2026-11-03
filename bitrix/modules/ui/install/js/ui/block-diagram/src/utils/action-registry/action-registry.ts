import { Browser, Type } from 'main.core';
import { shallowRef } from 'ui.vue3';

import { getReservedCombos } from './reserved-combos.ts';

export const ComboVerdict = Object.freeze({
	FREE: 'free',
	OCCUPIED: 'occupied',
	RESERVED: 'reserved',
});

/**
 * Only the entries that actually hold a combo. A default of null declares an action that ships
 * without one: it is a known action - an override may reach it - but nothing to index by combo.
 *
 * @param {Map<string, string | null>} bindings combo per action id
 * @returns {Map<string, string>}
 */
function keepAssigned(bindings)
{
	const assigned = new Map();

	bindings.forEach((combo, actionId) => {
		if (!Type.isNil(combo))
		{
			assigned.set(actionId, combo);
		}
	});

	return assigned;
}

/**
 * Applies the overrides on top of the defaults. An override of an action the defaults do not declare
 * is dropped, and a null combo takes the shortcut away from its action.
 *
 * @param {Map<string, string | null>} defaults canonical combo per action id, null for an action
 *   that ships without one
 * @param {Map<string, string | null>} overrides difference from the defaults
 * @returns {Map<string, string>}
 */
function mergeOverrides(defaults, overrides)
{
	const bindings = keepAssigned(defaults);

	overrides.forEach((combo, actionId) => {
		if (!defaults.has(actionId))
		{
			return;
		}

		if (Type.isNil(combo))
		{
			bindings.delete(actionId);

			return;
		}

		bindings.set(actionId, combo);
	});

	return bindings;
}

/**
 * @param {Map<string, string>} bindings combo per action id
 * @returns {Map<string, string>} action id per combo
 */
function invertBindings(bindings)
{
	const actionByCombo = new Map();

	bindings.forEach((combo, actionId) => {
		actionByCombo.set(combo, actionId);
	});

	return actionByCombo;
}

/**
 * Combos claimed by more than one action, each with the ids claiming it. Empty while the invariant
 * holds.
 *
 * @param {Map<string, string>} bindings combo per action id
 * @returns {string[]} one entry per conflicting combo
 */
function describeComboConflicts(bindings)
{
	const actionsByCombo = new Map();

	bindings.forEach((combo, actionId) => {
		const actions = actionsByCombo.get(combo) ?? [];
		actions.push(actionId);
		actionsByCombo.set(combo, actions);
	});

	const conflicts = [];

	actionsByCombo.forEach((actions, combo) => {
		if (actions.length > 1)
		{
			conflicts.push(`${combo} -> ${actions.join(', ')}`);
		}
	});

	return conflicts;
}

/**
 * Owns the link between an action id and its combo in both directions. The reverse index is the
 * single answer to "is this combo taken": it is rebuilt with every set, never searched through.
 * Combos arrive canonical - normalization stays with the input layer - and the registry knows nothing
 * beyond the ids: no names, no groups, no localization.
 *
 * Suspension is a flag of the registry, not a detached listener: the input layer keeps tracking
 * pressed keys throughout, or the modifiers it holds would drift apart from the keyboard by the time
 * the registry resumes. The validator stands outside the flag on purpose - the settings panel
 * suspends the registry exactly to capture a combo, and asks about that combo while the capture runs.
 *
 * The maps themselves are plain - a store keeps the registry markRaw - so the version is the only
 * reactive thing it publishes, and reading a combo touches it: a computed built on a combo follows
 * a reassignment of the set without knowing the version exists.
 */
export class ActionRegistry
{
	#comboByAction = new Map();
	#actionByCombo = new Map();
	#reservedCombos = getReservedCombos(Browser.isMac());
	#isSuspended = false;
	#version = shallowRef(0);

	/**
	 * @param {Map<string, string | null>} defaults canonical combo per action id. An action declared
	 *   with null ships without a combo and is still known: this is how a user gives it the first one.
	 * @param {Map<string, string | null>} [overrides] difference from the defaults
	 */
	applyBindings(defaults, overrides = new Map())
	{
		const plainDefaults = keepAssigned(defaults);
		const bindings = mergeOverrides(defaults, overrides);
		const actionByCombo = invertBindings(bindings);
		// One combo belongs to at most one action. A set that breaks the invariant is a data error:
		// it is rejected whole, and the plain defaults take its place.
		const isAccepted = actionByCombo.size === bindings.size;

		if (!isAccepted)
		{
			console.error(
				'ui.block-diagram: personal shortcuts dropped, the defaults take their place. '
				+ `A combo is claimed by several actions: ${describeComboConflicts(bindings).join('; ')}`,
			);
		}

		this.#comboByAction = isAccepted ? bindings : plainDefaults;
		this.#actionByCombo = isAccepted ? actionByCombo : invertBindings(plainDefaults);
		// The rejected set counts too: the registry stands on the defaults now, and that is a change
		// of what every combo of it is.
		this.#version.value += 1;
	}

	/**
	 * The count of sets applied so far. `getCombo()` reads it on its own, so a caption or an
	 * announcement built on a combo already follows a reassignment; this is for a reader that has to
	 * follow the set without asking for a combo of any action.
	 *
	 * @returns {number}
	 */
	getVersion()
	{
		return this.#version.value;
	}

	/**
	 * @returns {string | null} canonical combo of the action, null when it holds none
	 */
	getCombo(actionId)
	{
		// Deliberate call with the result dropped, not a leftover line: reading the version is what
		// subscribes a computed built on this call to a reassignment of the set. The maps behind the
		// combos are plain, so the version is the only reactive thing such a computed can follow.
		this.getVersion();

		return this.#comboByAction.get(actionId) ?? null;
	}

	/**
	 * @returns {string | null} action the combo runs, null while the registry is suspended
	 */
	getAction(combo)
	{
		if (this.#isSuspended)
		{
			return null;
		}

		return this.#actionByCombo.get(combo) ?? null;
	}

	/**
	 * @param {string} combo canonical combo to assign
	 * @param {string | null} [forActionId] action the combo is meant for: its own combo reads as free
	 * @returns {string} one of ComboVerdict
	 */
	validate(combo, forActionId = null)
	{
		if (this.#reservedCombos.has(combo))
		{
			return ComboVerdict.RESERVED;
		}

		const occupant = this.#actionByCombo.get(combo) ?? null;

		if (occupant === null || occupant === forActionId)
		{
			return ComboVerdict.FREE;
		}

		return ComboVerdict.OCCUPIED;
	}

	suspend()
	{
		this.#isSuspended = true;
	}

	resume()
	{
		this.#isSuspended = false;
	}

	get isSuspended()
	{
		return this.#isSuspended;
	}
}
