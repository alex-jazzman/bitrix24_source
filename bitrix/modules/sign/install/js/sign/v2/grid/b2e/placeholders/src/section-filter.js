import { Type } from 'main.core';

export class SectionFilter
{
	filterBySearchQuery(sections: Array, searchQuery: string): Array
	{
		const normalizedQueryValue = searchQuery.toLowerCase().trim();
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
		return items.filter((item) => item.name.toLowerCase().includes(query));
	}
}
