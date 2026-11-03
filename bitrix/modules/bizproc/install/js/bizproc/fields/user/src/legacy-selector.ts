import { Reflection, Type } from 'main.core';

// Side-effect import of the legacy CJSCore extension that defines the widget; it also
// brings bp_field_type, without which the widget throws on creation
// (user_selector.js:422-424). The class is still taken from the global namespace:
// a legacy extension exports nothing to import from.
import 'bp_user_selector';

const LEGACY_CLASS_NAME = 'BX.Bizproc.UserSelector';

/**
 * Configuration of the legacy user selector widget. Keys past the explicit ones come
 * from Property.Settings and are handed to the widget untouched.
 */
export type LegacySelectorConfig = {
	valueInputName?: string,
	value?: string,
	multiple?: boolean,
	required?: boolean,
	canUseHumanResources?: boolean,
	[key: string]: unknown,
};

/** One entity of the selection, as the widget parses it out of the value string. */
export type LegacySelectorItem = {
	id: string | number,
	entityId: string,
	title?: string,
	[key: string]: unknown,
};

/**
 * The selection dialog the widget builds along with the tag selector. Destroying it is the
 * only way out of the module-level registry of ui.entity-selector (dialog.ts:266,292).
 */
export type LegacyDialog = {
	destroy: () => void,
};

/** The part of the entity selector component inside the widget the field type talks to. */
export type LegacyTagSelector = {
	addTag: (item: LegacySelectorItem) => unknown,
	removeTags: () => void,
	setReadonly: (flag: boolean) => void,
	hideAddButton: () => void,
	// Null until the widget hands over dialog options; the legacy one always does
	// (user_selector.js:71-82), so in practice the dialog is there from the first render.
	getDialog: () => LegacyDialog | null,
};

/** The part of a legacy widget instance the field type talks to. */
export type LegacySelector = {
	valueNode: HTMLInputElement,
	getValue: () => string,
	tagSelector: LegacyTagSelector,
	parseValue: (value: string) => LegacySelectorItem[],
};

type LegacySelectorClass = {
	decorateNode: (container: HTMLElement, config: LegacySelectorConfig) => LegacySelector,
	// Its own JSDoc promises `LegacySelector | null`, but the body is a bare
	// WeakMap.get() (user_selector.js:61-64), so an unknown node yields `undefined`.
	getByNode: (container: HTMLElement) => LegacySelector | null | undefined,
};

/**
 * Resolved on every call, never cached: the legacy extension is a CJSCore one and may
 * arrive after this module, and unit tests swap the global between cases.
 */
function getLegacyClass(): LegacySelectorClass | null
{
	const legacyClass = Reflection.getClass(LEGACY_CLASS_NAME) as LegacySelectorClass | null;

	if (Type.isNull(legacyClass) || !Type.isFunction(legacyClass.decorateNode))
	{
		return null;
	}

	return legacyClass;
}

export function decorateNode(container: HTMLElement, config: LegacySelectorConfig): LegacySelector | null
{
	const legacyClass = getLegacyClass();

	if (Type.isNull(legacyClass))
	{
		return null;
	}

	return legacyClass.decorateNode(container, config);
}

export function getByNode(container: HTMLElement): LegacySelector | null
{
	const legacyClass = getLegacyClass();

	if (Type.isNull(legacyClass) || !Type.isFunction(legacyClass.getByNode))
	{
		return null;
	}

	return legacyClass.getByNode(container) ?? null;
}
