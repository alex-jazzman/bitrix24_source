import { Type, Tag, Event, Dom, html } from 'main.core';
import './style.css';
import 'ui.icons';

type ClickableUserOptions = {
	id: number,
	name: string,
	photoUrl: string,
	isSelected: boolean,
	isSingleUserColumn: boolean,
	filterFieldId: string,
	gridId: string,
	rootNodeId: string,
};

export class ClickableUser
{
	#id: number;
	#name: string;
	#photoUrl: string;
	#isSelected: boolean;
	#filterFieldName: string;
	#isSingleUserColumn: boolean;
	#isDisabled: boolean;
	#filterOptions: {};
	#filterManager: BX.Main.Filter;
	#rootNode: HTMLElement;

	constructor(options: ClickableUserOptions)
	{
		const rootNode = document.getElementById(options.rootNodeId);
		if (!rootNode)
		{
			throw new Error(`Root node with id "${options.rootNodeId}" not found.`);
		}

		this.#rootNode = rootNode;

		this.#id = options.id;
		this.#name = options.name;
		this.#photoUrl = options.photoUrl;
		this.#isSelected = options.isSelected;

		this.#filterFieldName = options.filterFieldId;
		this.#isSingleUserColumn = options.isSingleUserColumn;

		this.#filterOptions = {
			[options.filterFieldId]: [options.id],
			[`${options.filterFieldId}_label`]: [options.name],
		};

		this.#filterManager = BX.Main?.filterManager?.getById(options.gridId) ?? null;

		this.#isDisabled = !this.#isSingleUserColumn || Type.isNull(this.#filterManager);
	}

	render(): void
	{
		const imageStyle = this.#photoUrl === '' ? '' : `background-image: url(${this.#photoUrl});`;

		const content = Tag.render`
			<span class="crm-grid-user-avatar ui-icon ui-icon-common-user">
				<i style="${imageStyle}"></i>
			</span>
			<span class="crm-grid-username-inner">${this.#name}</span>
			<span class="crm-grid-filter-remove"></span>
		`;

		let contentClass = this.#isSelected ? 'crm-grid-username crm-grid-filter-active' : 'crm-grid-username';
		if (this.#isDisabled)
		{
			contentClass = 'crm-grid-username--disabled';
		}

		const wrapper = Tag.render`
			<a
				class="${contentClass}"
				href=""
				bx-tooltip-user-id="${this.#id}"
				bx-tooltip-context="b24"
			>
				${content}
			</a>
		`;

		Event.bind(wrapper, 'click', this.#onClick.bind(this));

		Dom.append(wrapper, this.#rootNode);
	}

	#onClick(event: Event): void
	{
		event.preventDefault();
		event.stopPropagation();

		if (this.#isDisabled)
		{
			return;
		}

		this.#toggleFilter();
	}

	#toggleFilter(): void
	{
		if (!this.#filterManager)
		{
			console.log('BX.Main.filterManager not initialized');

			return;
		}

		if (this.#isSelected)
		{
			this.#reduceFilter();
		}
		else
		{
			this.#extendFilter();
		}
	}

	#reduceFilter(): void
	{
		const reducedFields = this.#reduceCurrentFieldsValues();

		this.#filterManager.getApi().setFields(reducedFields);
		this.#filterManager.getSearch().apply();
	}

	#reduceCurrentFieldsValues(): Object
	{
		const reducedOptions = this.#filterOptions;
		const filterFieldsValues = this.#filterManager.getFilterFieldsValues();

		Object.entries(filterFieldsValues).forEach(([key, values]) => {
			if (Type.isArray(values) && key in reducedOptions)
			{
				if (this.#isSingleUserColumn)
				{
					filterFieldsValues[key] = [];
				}
				else
				{
					const index = values.indexOf(reducedOptions[key][0].toString());
					filterFieldsValues[key].splice(index, 1);
				}
			}
		});

		return filterFieldsValues;
	}

	async #extendFilter(): void
	{
		const extendedOptions = this.#extendCurrentFieldsValues();

		this.#filterManager.showGridAnimation();
		await this.#registerFieldToFilter();

		this.#filterManager.getApi().extendFilter(extendedOptions);
	}

	#extendCurrentFieldsValues(): Object
	{
		const extendedOptions = this.#filterOptions;
		const filterFieldsValues = this.#filterManager.getFilterFieldsValues();

		Object.entries(this.#filterOptions).forEach(([key, values]) => {
			const currentValues = filterFieldsValues[key];

			if (Type.isArray(currentValues) && Type.isArray(values))
			{
				if (this.#isSingleUserColumn)
				{
					extendedOptions[key] = values;
				}
				else
				{
					values.forEach((value) => {
						if (!currentValues.includes(value))
						{
							currentValues.push(value);
							extendedOptions[key] = currentValues;
						}
					});
				}
			}
		});

		return extendedOptions;
	}

	async #registerFieldToFilter(): void
	{
		const presetFields = this.#filterManager.getPreset().getFields();
		const oldFields = [];

		presetFields.forEach((field) => {
			oldFields.push(field.dataset.name);
		});

		const newFields = oldFields.slice(this.#filterManager.params.FIELDS);
		newFields.push(this.#filterFieldName);

		const fieldsData = await this.#filterManager.fetchFields([this.#filterFieldName], oldFields);

		fieldsData.forEach((field) => this.#filterManager.params.FIELDS.push(field));

		const fieldsForAdd = newFields.filter((field) => !oldFields.includes(field));

		const disableSaveFieldsSort = true;

		fieldsForAdd.forEach((fieldId) => {
			const field = fieldsData.find((item) => item.NAME === fieldId);
			if (field)
			{
				this.#filterManager.getPreset().addField(field, disableSaveFieldsSort);
				if (Type.isString(field.HTML))
				{
					const wrap = Tag.render`<div></div>`;
					Dom.append(this.#filterManager.getHiddenElement(), wrap);
					html(wrap, field.HTML);
				}
			}
		});

		this.#filterManager.saveFieldsSort();
	}
}
