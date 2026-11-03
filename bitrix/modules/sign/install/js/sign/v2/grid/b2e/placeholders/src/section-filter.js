import { Type } from 'main.core';
import { SectionType } from './types';
import { restoreSelection, splitStoredCode } from './modifiers/code-parser';
import type { ModifierSelection } from './modifiers/types';

/** How many rows the recent fields block offers, whatever the length of the history is. */
export const RECENT_FIELDS_LIMIT = 6;

/**
 * A row of the recent fields block: the field itself, the section its icon comes from, the code the
 * history stored and the set of modifiers that code carries.
 */
export type RecentField = {
	storedCode: string,
	placeholder: Object,
	sectionType: string,
	selection: ModifierSelection,
};

/** What the current list gives a row of the block: the field and the section its icon comes from. */
type ListedField = {
	placeholder: Object,
	sectionType: string,
};

/** Icon scope of the items: a section of the external human resources system names its own. */
const itemsSectionType = (section: Object): string => {
	if (section.type === SectionType.HCM_LINK && section.subsectionType)
	{
		return section.subsectionType;
	}

	return section.type;
};

const indexFieldsByCode = (sections: Array): Map<string, ListedField> => {
	const byCode = new Map();

	sections.forEach((section) => {
		const sectionType = itemsSectionType(section);
		const holders = Type.isArray(section.subsections) ? section.subsections : [section];

		holders.forEach((holder) => {
			if (!Type.isArray(holder.items))
			{
				return;
			}

			holder.items.forEach((item) => {
				if (item.value && !byCode.has(item.value))
				{
					byCode.set(item.value, { placeholder: item, sectionType });
				}
			});
		});
	});

	return byCode;
};

/**
 * A stored code names the field by its part before the tilde; the modifiers behind it are restored
 * only as far as the catalog explains them and the field is still offered them.
 */
const buildRecentField = (
	byCode: Map<string, ListedField>,
	storedCode: mixed,
	region: string,
): RecentField | null => {
	if (!Type.isStringFilled(storedCode))
	{
		return null;
	}

	const { baseCode, tail } = splitStoredCode(storedCode);
	const field = byCode.get(baseCode);
	if (!field)
	{
		return null;
	}

	const selection = restoreSelection(tail, field.placeholder, region);
	// A tail nothing explains would leave the row copying the base code - a twin of the row the same
	// field keeps in the block without any modifiers at all.
	if (tail !== '' && Object.keys(selection).length === 0)
	{
		return null;
	}

	return { ...field, storedCode, selection };
};

/**
 * Joins the copying history with the fields the user sees now: the history gives the codes, the
 * modifiers they were copied with and their order, the current list gives the names and the icons. A
 * code the list no longer holds never shows up, and a history that failed to arrive simply leaves the
 * block empty. One field copied with two different sets keeps two rows of its own.
 */
export const collectRecentFields = (
	sections: Array,
	recentFieldCodes: Array,
	region: string = '',
): RecentField[] => {
	if (!Type.isArray(sections) || !Type.isArray(recentFieldCodes))
	{
		return [];
	}

	const byCode = indexFieldsByCode(sections);

	return recentFieldCodes
		.map((storedCode) => buildRecentField(byCode, storedCode, region))
		.filter(Boolean)
		.slice(0, RECENT_FIELDS_LIMIT)
	;
};

export class SectionFilter
{
	filterBySearchQuery(sections: Array, searchQuery: string): Array
	{
		const normalizedQueryValue = searchQuery.toLowerCase().replaceAll('{', '').replaceAll('}', '').trim();
		if (!normalizedQueryValue)
		{
			return sections;
		}

		return sections
			.map((section) => this.#filterSection(section, normalizedQueryValue))
			.filter((section) => this.#hasContent(section))
		;
	}

	#hasContent(section: Object): boolean
	{
		if (Type.isArray(section.subsections))
		{
			return section.subsections.some((subsection) => Type.isArray(subsection.items) && subsection.items.length > 0);
		}

		return !Type.isNil(section.items) || !Type.isNil(section.data);
	}

	#filterSection(section: Object, query: string): Object
	{
		if (Type.isArray(section.items))
		{
			return this.#filterSimpleSection(section, query);
		}

		if (Type.isArray(section.subsections))
		{
			return this.#filterNestedSection(section, query);
		}

		return {};
	}

	#filterNestedSection(section: Object, query: string): Object
	{
		const matchedSubsections = section.subsections
			.map((subsection) => {
				const matchedItems = this.#filterItems(subsection.items, query);

				return matchedItems.length > 0 ? { ...subsection, items: matchedItems } : null;
			})
			.filter(Boolean)
		;

		return matchedSubsections.length > 0
			? { ...section, subsections: matchedSubsections }
			: {}
		;
	}

	#filterSimpleSection(section: Object, query: string): Object
	{
		const matchedItems = this.#filterItems(section.items, query);

		return matchedItems.length > 0
			? { ...section, items: matchedItems }
			: {}
		;
	}

	#filterItems(items: Array, query: string): Array
	{
		return items.filter((item) => {
			const name = item.name?.toLowerCase() ?? '';
			const value = item.value?.toLowerCase() ?? '';

			return name.includes(query) || value.includes(query);
		});
	}
}
