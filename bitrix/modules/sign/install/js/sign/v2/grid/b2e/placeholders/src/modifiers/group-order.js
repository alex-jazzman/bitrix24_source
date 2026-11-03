/**
 * The type of the field decides which groups of the catalog it is offered, and the groups keep the
 * catalog order. A field whose type no group names - an unknown type among them - gets none at all,
 * and the panel leaves such a row without an accordion.
 *
 * Pure functions over the catalog: no Vue, no DOM, no network.
 */

import { modifierCatalog } from './catalog';
import type { ModifierGroup, PlaceholderFieldType } from './types';

/** The part of a fields list item the filter reads. */
export type RankedField = {
	type: PlaceholderFieldType | null,
};

const isApplicable = (group: ModifierGroup, field: RankedField, region: string): boolean => {
	if (group.regions.length > 0 && !group.regions.includes(region))
	{
		return false;
	}

	return group.applicableTypes.includes(field.type);
};

export const orderGroups = (field: RankedField, region: string): ModifierGroup[] => {
	return modifierCatalog.groups.filter((group: ModifierGroup) => isApplicable(group, field, region));
};
