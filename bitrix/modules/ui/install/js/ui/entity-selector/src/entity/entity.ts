import { Extension, Runtime, Type } from 'main.core';
import { OrderedArray } from 'main.core.collections';

import { SearchField } from '../search/search-field';
import { TextNode } from '../common/text-node';
import { type TextNodeOptions } from '../common/text-node-options';

import { type Item } from '../item/item';
import { type EntityOptions } from './entity-options';
import { type SearchFieldOptions } from '../search/search-field-options';
import { type ItemBadgeOptions } from '../item/item-badge-options';
import { type EntityBadgeOptions } from './entity-badge-options';
import { type EntityFilterOptions } from './entity-filter-options';
import { EntityFilter } from './entity-filter';

/**
 * @memberof BX.UI.EntitySelector
 */
export class Entity
{
	static extensions: string[] | null = null;
	static defaultOptions: { [entityId: string]: { [key: string]: any } } | null = null;

	id: string;
	options: { [key: string]: any } = {};
	searchable: boolean = true;
	searchFields: OrderedArray<SearchField>;
	dynamicLoad: boolean = false;
	dynamicSearch: boolean = false;
	dynamicSearchMatchMode: 'all' | 'exact' = 'exact';
	substituteEntityId: string | null = null;
	fillRecentItems: boolean = true;
	searchCacheLimits: RegExp[] = [];
	filters: Map<string | null, EntityFilter> = new Map();

	itemOptions: { [key: string]: any } = {};
	tagOptions: { [key: string]: any } = {};
	badgeOptions: ItemBadgeOptions[] = [];
	textNodes: Map<string, Map<string, TextNode | null>> = new Map();

	constructor(entityOptions: EntityOptions)
	{
		let options: EntityOptions = Type.isPlainObject(entityOptions) ? entityOptions : ({} as EntityOptions);
		if (!Type.isStringFilled(options.id))
		{
			throw new Error('EntitySelector.Entity: "id" parameter is required.');
		}

		const defaultOptions = Entity.getEntityDefaultOptions(options.id) || {};
		options = Runtime.merge(JSON.parse(JSON.stringify(defaultOptions)), options);

		this.id = options.id.toLowerCase();
		this.options = Type.isPlainObject(options.options) ? options.options : {};
		this.itemOptions = Type.isPlainObject(options.itemOptions) ? options.itemOptions : {};
		this.tagOptions = Type.isPlainObject(options.tagOptions) ? options.tagOptions : {};
		this.badgeOptions = Type.isArray(options.badgeOptions) ? options.badgeOptions : [];
		this.substituteEntityId = Type.isStringFilled(options.substituteEntityId) ? options.substituteEntityId : null;
		this.fillRecentItems = Type.isBoolean(options.fillRecentItems) ? options.fillRecentItems : true;

		if (Type.isArray(options.filters))
		{
			options.filters.forEach((filterOptions: EntityFilterOptions) => {
				this.addFilter(filterOptions);
			});
		}

		this.searchFields = new OrderedArray((fieldA: SearchField, fieldB: SearchField) => {
			if (fieldA.getSort() !== null && fieldB.getSort() === null)
			{
				return -1;
			}

			if (fieldA.getSort() === null && fieldB.getSort() !== null)
			{
				return 1;
			}

			if (fieldA.getSort() === null && fieldB.getSort() === null)
			{
				return -1;
			}

			return fieldA.getSort()! - fieldB.getSort()!;
		});

		this.setSearchable(options.searchable);
		this.setDynamicLoad(options.dynamicLoad);
		this.setDynamicSearch(options.dynamicSearch);
		this.setDynamicSearchMatchMode(options.dynamicSearchMatchMode);
		this.setSearchFields(options.searchFields);
		this.setSearchCacheLimits(options.searchCacheLimits);
	}

	static getDefaultOptions()
	{
		if (this.defaultOptions === null)
		{
			this.defaultOptions = {};
			for (const extension of this.getExtensions())
			{
				const settings = Extension.getSettings(extension);
				const entities: Array<{ id: string; options: { [key: string]: any } }> = settings.get('entities', []);
				for (const entity of entities)
				{
					if (Type.isStringFilled(entity.id) && Type.isPlainObject(entity.options))
					{
						this.defaultOptions[entity.id] = JSON.parse(JSON.stringify(entity.options)); // clone
					}
				}
			}
		}

		return this.defaultOptions;
	}

	static getExtensions(): string[]
	{
		if (this.extensions === null)
		{
			const settings = Extension.getSettings('ui.entity-selector');
			this.extensions = settings.get('extensions', []);
		}

		return this.extensions!;
	}

	static getEntityDefaultOptions(entityId: string)
	{
		return this.getDefaultOptions()[entityId] || null;
	}

	static getItemOptions(entityId: string, entityType?: string)
	{
		if (!Type.isStringFilled(entityId))
		{
			return null;
		}

		const options = this.getEntityDefaultOptions(entityId);
		const itemOptions = options && options.itemOptions ? options.itemOptions : null;

		if (Type.isUndefined(entityType))
		{
			return itemOptions;
		}

		return itemOptions && !Type.isUndefined(itemOptions[entityType]) ? itemOptions[entityType] : null;
	}

	static getTagOptions(entityId: string, entityType?: string)
	{
		if (!Type.isStringFilled(entityId))
		{
			return null;
		}

		const options = this.getEntityDefaultOptions(entityId);
		const tagOptions = options && options.tagOptions ? options.tagOptions : null;

		if (Type.isUndefined(entityType))
		{
			return tagOptions;
		}

		return tagOptions && !Type.isUndefined(tagOptions[entityType]) ? tagOptions[entityType] : null;
	}

	getId(): string
	{
		return this.id;
	}

	getOptions(): { [key: string]: any }
	{
		return this.options;
	}

	getItemOptions(): { [key: string]: any }
	{
		return this.itemOptions;
	}

	static getItemOption(entityId: string, option: string, entityType?: string): any
	{
		return this.getOptionInternal(this.getItemOptions(entityId), option, entityType);
	}

	getItemOption(option: string, entityType?: string): any
	{
		return Entity.getOptionInternal(this.itemOptions, option, entityType);
	}

	getTagOptions(): { [key: string]: any }
	{
		return this.tagOptions;
	}

	static getTagOption(entityId: string, option: string, entityType?: string): any
	{
		return this.getOptionInternal(this.getTagOptions(entityId), option, entityType);
	}

	getTagOption(option: string, entityType?: string): any
	{
		return Entity.getOptionInternal(this.tagOptions, option, entityType);
	}

	static getOptionInternal(options: Record<string, any> | null, option: string, type?: string): any
	{
		if (!Type.isPlainObject(options))
		{
			return null;
		}

		const map: Record<string, any> = options;
		if (map[type as string] && !Type.isUndefined(map[type as string][option]))
		{
			return map[type as string][option];
		}

		if (map['default'] && !Type.isUndefined(map['default'][option]))
		{
			return map['default'][option];
		}

		return null;
	}

	getBadges(item: Item): EntityBadgeOptions[]
	{
		const entityTypeBadges = this.getItemOption('badges', item.getEntityType()) || [];
		const badges = [...entityTypeBadges];

		this.badgeOptions.forEach((badge: EntityBadgeOptions) => {
			if (Type.isPlainObject(badge.conditions))
			{
				for (const condition in badge.conditions)
				{
					if (item.getCustomData().get(condition) !== badge.conditions[condition])
					{
						return;
					}
				}

				badges.push(badge);
			}
		});

		return badges;
	}

	getOptionTextNode(option: string, entityType?: string): TextNode | null
	{
		if (!Type.isString(option))
		{
			return null;
		}

		if (!Type.isString(entityType))
		{
			entityType = 'default';
		}

		let optionNodes = this.textNodes.get(option);
		let node = optionNodes ? optionNodes.get(entityType) : undefined;

		if (Type.isUndefined(node))
		{
			if (!optionNodes)
			{
				optionNodes = new Map();
				this.textNodes.set(option, optionNodes);
			}

			const itemOption = this.getItemOption(option, entityType);
			node = (
				Type.isString(itemOption) || Type.isPlainObject(itemOption)
					? new TextNode(itemOption as string | TextNodeOptions)
					: null
			);

			optionNodes.set(entityType, node);
		}

		return node;
	}

	isSearchable(): boolean
	{
		return this.searchable;
	}

	setSearchable(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.searchable = flag;
		}
	}

	getSearchFields(): OrderedArray<SearchField>
	{
		return this.searchFields;
	}

	setSearchFields(searchFields: SearchFieldOptions[] | undefined): void
	{
		this.searchFields.clear();

		// Default Search Fields
		const titleField = new SearchField({ name: 'title', searchable: true, system: true, type: 'string' });
		const subtitleField = new SearchField({ name: 'subtitle', searchable: true, system: true, type: 'string' });
		this.searchFields.add(titleField);
		this.searchFields.add(subtitleField);

		// Custom Search Fields
		const customFields = Type.isArray(searchFields) ? searchFields : [];
		for (const fieldOptions of customFields)
		{
			const field = new SearchField(fieldOptions);
			if (field.isSystem()) // Entity can override default fields.
			{
				// delete a default title field
				if (field.getName() === 'title')
				{
					this.searchFields.delete(titleField);
				}
				else if (field.getName() === 'subtitle')
				{
					this.searchFields.delete(subtitleField);
				}
			}

			this.searchFields.add(field);
		}

		this.searchFields.forEach((field: SearchField, index: number) => {
			field.setSort(index);
		});
	}

	setSearchCacheLimits(limits: string[] | undefined): void
	{
		if (Type.isArrayFilled(limits))
		{
			for (const limit of limits)
			{
				if (Type.isStringFilled(limit))
				{
					this.searchCacheLimits.push(new RegExp(limit, 'i'));
				}
			}
		}
	}

	getSearchCacheLimits(): RegExp[]
	{
		return this.searchCacheLimits;
	}

	hasDynamicLoad(): boolean
	{
		return this.dynamicLoad;
	}

	setDynamicLoad(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.dynamicLoad = flag;
		}
	}

	hasDynamicSearch(): boolean
	{
		return this.dynamicSearch;
	}

	setDynamicSearch(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.dynamicSearch = flag;
		}
	}

	setDynamicSearchMatchMode(mode: 'all' | 'exact' | undefined): void
	{
		if (mode === 'all' || mode === 'exact')
		{
			this.dynamicSearchMatchMode = mode;
		}
	}

	getDynamicSearchMatchMode(): 'all' | 'exact'
	{
		return this.dynamicSearchMatchMode;
	}

	getFilters(): EntityFilter[]
	{
		return [...this.filters.values()];
	}

	addFilters(filters: EntityFilterOptions[]): void
	{
		if (Type.isArray(filters))
		{
			filters.forEach((filterOptions: EntityFilterOptions) => {
				this.addFilter(filterOptions);
			});
		}
	}

	addFilter(filterOptions: EntityFilterOptions): void
	{
		if (Type.isPlainObject(filterOptions))
		{
			const filter = new EntityFilter(filterOptions);
			this.filters.set(filter.getId(), filter);
		}
	}

	getFilter(id: string): EntityFilter | null
	{
		return this.filters.get(id) || null;
	}

	getSubstituteEntityId(): string | null
	{
		return this.substituteEntityId;
	}

	shouldFillRecentItems(): boolean
	{
		return this.fillRecentItems;
	}

	toJSON()
	{
		return {
			id: this.getId(),
			options: this.getOptions(),
			searchable: this.isSearchable(),
			dynamicLoad: this.hasDynamicLoad(),
			dynamicSearch: this.hasDynamicSearch(),
			filters: this.getFilters(),
			substituteEntityId: this.getSubstituteEntityId(),
			fillRecentItems: this.shouldFillRecentItems(),
		};
	}
}
