/**
 * The catalog only describes how to assemble a symbolic code string. What a modifier does to the
 * substituted value belongs to the modules named in the header of `catalog.js`.
 */

export type ModifierGroupId =
	| 'case'
	| 'fullName'
	| 'datetime'
	| 'phone'
	| 'address'
	| 'multiValue'
	| 'letterCase';

/**
 * Two independent mechanics behind the "several values" group: `collection` walks a provider
 * collection, `multiValue` renders a single multiple value.
 */
export type ModifierMechanics = 'collection' | 'multiValue';

/**
 * Exactly the `type` values the fields list can hold, no wider
 * (`Bitrix\Sign\Item\Document\Placeholder\Placeholder::SUPPORTED_TYPES`).
 */
export type PlaceholderFieldType =
	| 'fullname'
	| 'firstname'
	| 'lastname'
	| 'patronymic'
	| 'position'
	| 'snils'
	| 'inn'
	| 'phone'
	| 'email'
	| 'date'
	| 'address'
	| 'string'
	| 'list'
	| 'integer'
	| 'double'
	| 'external_id'
	| 'external_date';

export type ModifierVariant = {
	id: string,
	labelKey: string,
	/** Parameter strings, stored literally: they go into the code after `~` as is. */
	parameters: string[],
	/** A comma inside a single parameter value: such a variant does not combine with others. */
	exclusive: boolean,
	mechanics: ModifierMechanics | null,
};

export type ModifierGroup = {
	id: ModifierGroupId,
	labelKey: string,
	/** The only field types the group is offered to. */
	applicableTypes: PlaceholderFieldType[],
	/** Non-empty makes the group available in these portal regions only. */
	regions: string[],
	variants: ModifierVariant[],
};

export type ModifierCatalog = {
	groups: ModifierGroup[],
};

/** Chosen variant per group; a group missing from the map has nothing chosen. */
export type ModifierSelection = { [groupId: ModifierGroupId]: ModifierVariant };
