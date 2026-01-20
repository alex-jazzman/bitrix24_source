import { Type, Tag, Dom } from 'main.core';
import { TagSelector } from 'ui.entity-selector';

export type EntitySelectorOptions = {
	containerId: string,
	config?: Record<string, any>,
	inputName: string,
	property: Record<string, any>,
	initialValue?: string;
};

export class EntitySelector
{
	static selectors: WeakMap<HTMLElement, EntitySelector> | null = null;

	#containerId: string;
	#config: Record<string, any>;
	#inputName: string;
	#property: Record<string, any>;
	#initialValue: string | Array;

	#container: HTMLElement | null = null;
	#selector: TagSelector | null = null;

	#hiddenInputsContainer: HTMLElement | null = null;

	constructor(options: EntitySelectorOptions)
	{
		this.#containerId = options.containerId;
		this.#config = options.config || {};
		this.#inputName = options.inputName;
		this.#property = options.property;
		this.#initialValue = options.initialValue || '';
	}

	init(): void
	{
		this.#container = document.getElementById(this.#containerId);
		if (!this.#container)
		{
			return;
		}

		this.#createSelector();
		this.#createHiddenInputsContainer();
		this.#renderHiddenInputs(this.#parseInitialValue(this.#initialValue));
		this.#bindEvents();
	}

	#isMultiple(): boolean
	{
		const multiple = this.#property.Multiple;

		return multiple === true;
	}

	#createSelector(): void
	{
		this.#selector = new TagSelector(this.#config);
		this.#selector.renderTo(this.#container);
	}

	#createHiddenInputsContainer(): void
	{
		this.#hiddenInputsContainer = Tag.render`<div></div>`;
		Dom.hide(this.#hiddenInputsContainer);
		Dom.append(this.#hiddenInputsContainer, this.#container);
	}

	#bindEvents(): void
	{
		if (!this.#selector?.dialog)
		{
			return;
		}

		this.#selector.dialog.subscribe('Item:onSelect', (event) => {
			this.#updateInputValues();
		});

		this.#selector.dialog.subscribe('Item:onDeselect', (event) => {
			this.#updateInputValues();
		});
	}

	#updateInputValues(): void
	{
		if (!this.#selector)
		{
			return;
		}

		const dialog = this.#selector.getDialog();
		if (!dialog)
		{
			return;
		}

		const selectedItems = dialog.getSelectedItems();
		const values = selectedItems.map((item) => String(item.getId()));

		this.#renderHiddenInputs(values);
	}

	#renderHiddenInputs(values: Array): void
	{
		if (!this.#hiddenInputsContainer)
		{
			return;
		}

		Dom.clean(this.#hiddenInputsContainer);

		if (values.length === 0)
		{
			this.#appendInput('');

			return;
		}

		values.forEach((value) => {
			this.#appendInput(value);
		});
	}

	#appendInput(value: string): void
	{
		if (!this.#hiddenInputsContainer)
		{
			return;
		}

		const input = Tag.render`<input type="hidden" />`;
		input.name = this.#isMultiple() ? `${this.#inputName}[]` : this.#inputName;
		input.value = value;

		Dom.append(input, this.#hiddenInputsContainer);
	}

	#parseInitialValue(value): Array
	{
		if (!value)
		{
			return [];
		}

		if (this.#isMultiple() && Type.isArray(value))
		{
			return value;
		}

		return [value];
	}

	static create(options: EntitySelectorOptions): EntitySelector
	{
		const instance = new EntitySelector(options);
		instance.init();

		return instance;
	}

	static decorateNode(container: ?HTMLElement, options: Object): ?EntitySelector
	{
		if (!container)
		{
			return null;
		}

		if (!EntitySelector.selectors)
		{
			EntitySelector.selectors = new WeakMap();
		}

		let selector = EntitySelector.selectors.get(container);
		if (!selector)
		{
			const config = JSON.parse(container.dataset.config || '{}');
			config.containerId = container.id;
			const configs = Type.isPlainObject(options) ? options : {};
			config.config = { ...config.config, ...configs };

			selector = BX.Bizproc.EntitySelector.create(config);
			EntitySelector.selectors.set(container, selector);
		}

		return selector;
	}

	destroy(): void
	{
		this.#container = null;
		this.#selector = null;
		this.#hiddenInputsContainer = null;
	}
}

BX.Bizproc.EntitySelector = EntitySelector;
