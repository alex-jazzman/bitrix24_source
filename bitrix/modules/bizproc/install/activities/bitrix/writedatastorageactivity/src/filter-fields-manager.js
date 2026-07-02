import { Dom, Type } from 'main.core';
import { ConditionGroup, ConditionGroupSelector } from 'bizproc.automation';
import { BaseEvent } from 'main.core.events';

import type { PropertyOptions } from './types';

export class FilterFieldsManager
{
	#form: HTMLFormElement;
	#options: PropertyOptions;
	#currentStorageId: string;
	#storageBlocks: Array<Object> = [];
	#mapStorageBlocksToFilterFields: Function;

	#filterFieldsContainer: ?HTMLElement = null;
	#filteringFieldsPrefix: string = '';
	#filterFieldsMap: Map<string, any> = new Map();
	#conditionGroup: ?ConditionGroup = null;
	#conditionGroupSelector: ?ConditionGroupSelector = null;

	constructor({ form, options, currentStorageId, storageBlocks, mapStorageBlocksToFilterFields }: {
		form: HTMLFormElement;
		options: PropertyOptions;
		currentStorageId: string;
		storageBlocks: Array<Object>;
		mapStorageBlocksToFilterFields: Function;
	})
	{
		this.#form = form;
		this.#options = options;
		this.#currentStorageId = currentStorageId;
		this.#storageBlocks = storageBlocks || [];
		this.#mapStorageBlocksToFilterFields = mapStorageBlocksToFilterFields;

		this.#initFilterFields();
	}

	render(): void
	{
		if (!Type.isNil(this.#conditionGroup) && Type.isNil(this.#conditionGroupSelector))
		{
			const fields = Object.values(this.#filterFieldsMap.get(this.#currentStorageId) || {});

			this.#conditionGroupSelector = new ConditionGroupSelector(this.#conditionGroup, {
				fields,
				fieldPrefix: this.#filteringFieldsPrefix,
				customSelector: Type.isFunction(window.BPAShowSelector) ? this.#showFieldSelector : null,
				caption: {
					head: this.#options.headCaption,
					collapsed: this.#options.collapsedCaption,
				},
				isExpanded: this.#getFilterExpandedState(),
			});

			this.#conditionGroupSelector.subscribe('onToggleGroupViewClick', (event: BaseEvent) => {
				const data = event.getData();
				this.#saveFilterExpandedState(data.isExpanded);
			});

			Dom.clean(this.#filterFieldsContainer);
			Dom.append(this.#conditionGroupSelector.createNode(), this.#filterFieldsContainer);
		}
	}

	resetConditions(): void
	{
		this.#conditionGroupSelector = null;
		this.#conditionGroup = new ConditionGroup();
	}

	setCurrentStorageId(id: string): void
	{
		this.#currentStorageId = id;
	}

	#initFilterFields(): void
	{
		this.#filterFieldsContainer = this.#form.querySelector(
			'[data-role="bpa-sra-filter-fields-container"]',
		);
		this.#filteringFieldsPrefix = this.#options.filteringFieldsPrefix;
		this.#filterFieldsMap = new Map(
			Object.entries(this.#options.filterFieldsMap)
				.map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]),
		);

		this.#filterFieldsMap = this.#mapStorageBlocksToFilterFields(this.#storageBlocks, this.#filterFieldsMap);

		this.#conditionGroup = new ConditionGroup(this.#options.conditions);
	}

	#getFilterExpandedState(): boolean
	{
		return this.#form.is_expanded?.value === 'Y';
	}

	#saveFilterExpandedState(isExpanded: boolean): void
	{
		if (this.#form.is_expanded)
		{
			this.#form.is_expanded.value = isExpanded ? 'Y' : 'N';
		}
	}

	#showFieldSelector(targetInputId: string): void
	{
		window.BPAShowSelector(targetInputId, 'string', '');
	}
}
