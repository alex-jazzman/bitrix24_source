import { Type, Tag, Dom } from 'main.core';
import { TagSelector, type Item } from 'ui.entity-selector';
import Footer from './footer';

export type EntitySelectorOptions = {
	containerId: string,
	config?: Record<string, any>,
	inputName: string,
	property: Record<string, any>,
	initialValue?: string | Array;
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

	#useObjectResponse(): boolean
	{
		return this.#config.useObjectResponse === true;
	}

	#createSelector(): void
	{
		if (this.#config.dialogOptions.footerOptions)
		{
			this.#config.dialogOptions.footer = Footer;
		}
		this.#config.dialogOptions.id = `entityselector_${this.#inputName}`;
		if (this.#useObjectResponse())
		{
			this.#config.dialogOptions.preselectedItems = this.#getPreselectedItems();
		}

		this.#selector = new TagSelector(this.#config);
		this.#selector.renderTo(this.#container);
	}

	#getPreselectedItems(): Array
	{
		const preselectedItems = [];

		const initialValue = Type.isArray(this.#initialValue)
			? this.#initialValue
			: [this.#initialValue]
		;

		initialValue
			.forEach((initialValueItem) => {
				if (
					Type.isStringFilled(initialValueItem.id)
					&& Type.isStringFilled(initialValueItem.entityId)
				)
				{
					preselectedItems.push([initialValueItem.entityId, initialValueItem.id]);
				}
			});

		return preselectedItems;
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

		const items = dialog
			.getSelectedItems()
			.map((item: Item) => {
				return {
					id: item.getId(),
					entityId: item.getEntityId(),
				};
			})
		;

		this.#renderHiddenInputs(items);
	}

	#renderHiddenInputs(items: { id: string | number, entityId: string }[]): void
	{
		if (!this.#hiddenInputsContainer)
		{
			return;
		}

		Dom.clean(this.#hiddenInputsContainer);
		let index = 0;

		if (items.length === 0)
		{
			this.#appendInput(null, index);

			return;
		}

		items.forEach((item) => this.#appendInput(item, index++));
	}

	#appendInput(item: ?{ id: string | number, entityId: string }, index: number): void
	{
		if (!this.#hiddenInputsContainer)
		{
			return;
		}

		if (this.#useObjectResponse())
		{
			if (item === null)
			{
				const nullInput = Tag.render`<input type="hidden" name="${this.#inputName}[]" value="">`;
				Dom.append(nullInput, this.#hiddenInputsContainer);

				return;
			}

			const idInput = Tag.render`<input type="hidden">`;
			idInput.name = this.#isMultiple() ? `${this.#inputName}[${index}][id]` : `${this.#inputName}[id]`;
			idInput.value = item.id;

			Dom.append(idInput, this.#hiddenInputsContainer);

			const entityIdInput = Tag.render`<input type="hidden">`;
			entityIdInput.name = this.#isMultiple() ? `${this.#inputName}[${index}][entityId]` : `${this.#inputName}[entityId]`;
			entityIdInput.value = item.entityId;

			Dom.append(entityIdInput, this.#hiddenInputsContainer);

			return;
		}

		const input = Tag.render`<input type="hidden" />`;
		input.name = this.#isMultiple() ? `${this.#inputName}[]` : this.#inputName;
		input.value = item?.id ?? '';

		Dom.append(input, this.#hiddenInputsContainer);
	}

	#parseInitialValue(value): Array
	{
		if (!value)
		{
			return [];
		}

		if (this.#useObjectResponse())
		{
			const values = Type.isArray(value) ? value : [value];

			return values
				.map((valueItem) => {
					if (Type.isStringFilled(valueItem.id) && Type.isStringFilled(valueItem.entityId))
					{
						return {
							id: valueItem.id,
							entityId: valueItem.entityId,
						};
					}

					return null;
				})
				.filter((valueItem) => valueItem !== null)
			;
		}

		const values = this.#isMultiple() && Type.isArray(value) ? value : [value];

		return values
			.map((valueItem) => {
				if (Type.isStringFilled(valueItem.id))
				{
					return {
						id: valueItem.id,
					};
				}

				return {
					id: valueItem,
				};
			})
		;
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
