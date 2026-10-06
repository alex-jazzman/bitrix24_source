import { BaseEvent, EventEmitter } from 'main.core.events';
import { CounterPanel, CounterItem } from 'ui.counterpanel';
import { Dom, Type } from 'main.core';

import { Filter } from './filter';
import { formatCounterValue } from './format-counter-value';
import { clearTruncationSymbol } from './clear-truncation-symbol';

// ui.cnt truncates a value above its limit to "<limit>+"; the exact number is rendered instead
const EXACT_VALUE_LIMIT = Number.MAX_SAFE_INTEGER;
const AIR_VALUE_SELECTOR = '.ui-counter__value';

export class DocumentCounter extends CounterPanel
{
	#filter: Filter;
	#resetAllFields: boolean;
	#thousandsSeparator: string;

	constructor(options: Object)
	{
		super({
			target: options.target,
			items: DocumentCounter.getCounterItems(options.items),
			multiselect: false,
			title: options.title,
		});

		this.#filter = new Filter({
			filterId: options.filterId,
		});

		EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.#onActivateItem.bind(this));
		EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.#onDeactivateItem.bind(this));
		EventEmitter.subscribe('BX.Main.Filter:apply', this.#onFilterApply.bind(this));
		EventEmitter.subscribe('BX.Sign.DocumentCounter.Item:updateCounter', this.#onCounterUpdate.bind(this));

		this.#resetAllFields = Boolean(options?.resetAllFields);
		// An empty string is a legal separator of a culture, so the type is checked instead of truthiness
		this.#thousandsSeparator = Type.isString(options.thousandsSeparator) ? options.thousandsSeparator : '';
	}

	init(): void
	{
		super.init();

		// Same synchronous tick as the parent render, so the truncated value never flashes
		this.getItems().forEach((item: CounterItem) => this.#applyExactValue(item));
	}

	static getCounterItems(items: Array): Object[]
	{
		return items.map((item) => {
			return {
				id: item.id,
				title: item.title,
				value: Number.parseInt(item.value, 10),
				isRestricted: item.isRestricted,
				color: item.color === 'THEME' ? 'GRAY' : item.color,
				hideValue: item.hideValue || false,
				isActive: item?.isActive === true,
			};
		});
	}

	#onActivateItem(event: BaseEvent): void
	{
		const { name, value } = this.#getFieldData(event.getData());

		if (!this.#processItemSelection(name, value))
		{
			event.preventDefault();
		}
	}

	#onDeactivateItem(event: BaseEvent): void
	{
		if (this.#isAllDeactivated())
		{
			this.#filter.deactivate();
		}
	}

	#processItemSelection(name: string, value: string): boolean
	{
		this.#filter.toggleField(name, value, this.#resetAllFields);

		return true;
	}

	#getFieldData(item): Object
	{
		const fieldData = item.id.split('__');

		return {
			name: fieldData[0].toUpperCase(),
			value: fieldData[1].toUpperCase(),
		};
	}

	#isAllDeactivated(): Boolean
	{
		return this.getItems().every((record: CounterItem) => {
			return !record.isActive;
		});
	}

	#onFilterApply(): void
	{
		let compoundId = '';
		const filterRows = this.#filter.getFilterRows();
		const counterItemIds = new Set(this.items.map((item) => item.id.toLowerCase()));

		const activeField = Object.entries(filterRows).find((row) => {
			if (!Type.isPlainObject(row[1]))
			{
				return false;
			}

			const values = Object.values(row[1]);
			const result = [
				row[0],
				values.join('_'),
			];

			compoundId = result.join('__').toLowerCase();

			return counterItemIds.has(compoundId);
		});

		this.getItems().forEach((item) => {
			item.deactivate(false);
			if (activeField && (item.id.toLowerCase() === compoundId))
			{
				// eslint-disable-next-line no-param-reassign
				item.activate(false);
			}
		});
	}

	#onCounterUpdate(event: BaseEvent): void
	{
		const { id, count } = event.getData();
		for (const item: CounterItem of this.getItems())
		{
			if (item.id === id)
			{
				item.updateValue(count);
				this.#applyExactValue(item);
				const color = count > 0 ? 'DANGER' : 'GRAY';
				item.updateColor(color);

				break;
			}
		}
	}

	#applyExactValue(item: CounterItem): void
	{
		const counter = item.counter;

		if (!counter || item.isRestricted || item.hideValue || !Type.isNumber(item.value))
		{
			return;
		}

		// The air design redraws the value and the "+" sign from its own fields on every update,
		// so the limit has to be raised even though the text is overwritten right after
		counter.setMaxValue(EXACT_VALUE_LIMIT);

		const counterContainer = counter.getCounterContainer();
		const valueNode = this.#getValueNode(counterContainer);

		if (valueNode)
		{
			Dom.adjust(valueNode, { text: formatCounterValue(item.value, this.#thousandsSeparator) });
		}

		clearTruncationSymbol(counterContainer);
	}

	#getValueNode(counterContainer: ?HTMLElement): ?HTMLElement
	{
		// Air keeps the value in a dedicated node next to the "+" sign, the classic design writes
		// the text into the counter container itself
		return counterContainer?.querySelector(AIR_VALUE_SELECTOR) ?? counterContainer;
	}
}
