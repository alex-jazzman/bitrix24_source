import { Type, Tag, Dom, Event } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { ChipDesign, ChipSize, Chip } from 'ui.system.chip';
import { InputSize, InputDesign } from './const';

import './input.css';

import type { ChipOptions } from 'ui.system.chip';

export type InputOptions = {
	value?: string,
	rowsQuantity?: number,
	resize?: 'none' | 'both' | 'horizontal' | 'vertical',
	label?: string,
	labelInline?: boolean,
	placeholder?: string,
	error?: string,
	size?: InputSize,
	design?: InputDesign,
	icon?: ?string,
	chips?: ChipOptions[],
	center?: boolean,
	withSearch?: boolean,
	withClear?: boolean,
	dropdown?: boolean,
	clickable?: boolean,
	stretched?: boolean,
	active?: boolean,
	onClick?: Function,
	onFocus?: Function,
	onBlur?: Function,
	onInput?: Function,
	onClear?: Function,
	onChipClick?: Function,
	onChipClear?: Function,
};

export class Input
{
	#value: string = '';
	#rows: number = 1;
	#resize: 'none' | 'both' | 'horizontal' | 'vertical' = 'both';
	#label: string = '';
	#labelInline: boolean = false;
	#placeholder: string = '';
	#error: string = '';
	#size: InputSize = InputSize.Lg;
	#design: InputDesign = InputDesign.Grey;
	#icon: ?string = null;
	#chips: ChipOptions[] = [];
	#center: boolean = false;
	#withSearch: boolean = false;
	#withClear: boolean = false;
	#dropdown: boolean = false;
	#clickable: boolean = false;
	#stretched: boolean = false;
	#active: boolean = false;

	#onClick: ?Function = null;
	#onFocus: ?Function = null;
	#onBlur: ?Function = null;
	#onInput: ?Function = null;
	#onClear: ?Function = null;
	#onChipClick: ?Function = null;
	#onChipClear: ?Function = null;

	#wrapper: ?HTMLElement = null;
	#labelElement: ?HTMLElement = null;
	#containerElement: ?HTMLElement = null;
	#inputElement: ?HTMLInputElement | ?HTMLTextAreaElement = null;
	#errorElement: ?HTMLElement = null;
	#iconElement: ?HTMLElement = null;
	#clearElement: ?HTMLElement = null;
	#searchElement: ?HTMLElement = null;
	#dropdownElement: ?HTMLElement = null;
	#chipsInstances: Chip[] = [];
	#chipElements: HTMLElement[] = [];
	#chipsContainer: ?HTMLElement = null;
	#focused: boolean = false;

	constructor(options: InputOptions = {})
	{
		this.#applyOptions(options);
	}

	#applyOptions(options: InputOptions): void
	{
		this.#value = options.value ?? '';
		this.#rows = options.rowsQuantity ?? 1;
		this.#resize = options.resize ?? 'both';
		this.#label = options.label ?? '';
		this.#labelInline = options.labelInline === true;
		this.#placeholder = options.placeholder ?? '';
		this.#error = options.error ?? '';
		this.#size = options.size ?? InputSize.Lg;
		this.#design = options.design ?? InputDesign.Grey;
		this.#icon = options.icon ?? null;
		this.#chips = Array.isArray(options.chips) ? options.chips : [];
		this.#center = options.center === true;
		this.#withSearch = options.withSearch === true;
		this.#withClear = options.withClear === true;
		this.#dropdown = options.dropdown === true;
		this.#clickable = options.clickable === true;
		this.#stretched = options.stretched === true;
		this.#active = options.active === true;

		this.#onClick = options.onClick ?? null;
		this.#onFocus = options.onFocus ?? null;
		this.#onBlur = options.onBlur ?? null;
		this.#onInput = options.onInput ?? null;
		this.#onClear = options.onClear ?? null;
		this.#onChipClick = options.onChipClick ?? null;
		this.#onChipClear = options.onChipClear ?? null;
	}

	render(): HTMLElement
	{
		if (this.#wrapper)
		{
			return this.#wrapper;
		}

		this.#containerElement = Tag.render`
			<div class="ui-system-input-container">
				${this.#renderChips()}
				${this.#renderIcon()}
				${this.#renderInput()}
				${this.#renderSearchIcon()}
				${this.#renderClearIcon()}
				${this.#renderDropdownIcon()}
			</div>
		`;

		this.#wrapper = Tag.render`
			<div class="ui-system-input ${this.#getWrapperClasses()}">
				${this.#renderLabel()}
				${this.#containerElement}
				${this.#renderError()}
			</div>
		`;

		this.#bindEvents();

		if (this.#active && !this.#clickable)
		{
			this.focus();
		}

		return this.#wrapper;
	}

	setValue(value: string): void
	{
		this.#value = value;

		if (this.#inputElement)
		{
			this.#inputElement.value = value;
		}
	}

	getValue(): string
	{
		return this.#value;
	}

	setLabel(value: string): void
	{
		this.#label = value;

		if (this.#labelElement)
		{
			this.#labelElement.textContent = value;
		}
	}

	getLabel(): string
	{
		return this.#label;
	}

	setPlaceholder(value: string): void
	{
		this.#placeholder = value;

		if (this.#inputElement)
		{
			this.#inputElement.placeholder = value;
		}
	}

	getPlaceholder(): string
	{
		return this.#placeholder;
	}

	setError(value: string): void
	{
		this.#error = value;

		if (this.#errorElement)
		{
			this.#errorElement.textContent = value;
		}

		this.#updateClasses();
	}

	getError(): string
	{
		return this.#error;
	}

	setSize(value: string): void
	{
		this.#size = value;
		this.#updateClasses();
	}

	getSize(): string
	{
		return this.#size;
	}

	setDesign(value: string): void
	{
		this.#design = value;
		this.#updateClasses();
		this.#updateChips();

		if (this.#isDisabled())
		{
			Dom.attr(this.#inputElement, { disabled: '' });
			Dom.attr(this.#errorElement, { hidden: '' });
		}
		else
		{
			if (this.#inputElement)
			{
				this.#inputElement.removeAttribute('disabled');
			}

			if (this.#errorElement)
			{
				this.#errorElement.removeAttribute('hidden');
			}
		}
	}

	getDesign(): string
	{
		return this.#design;
	}

	setIcon(value: string): void
	{
		this.#icon = value;
		this.#updateIcon();
	}

	getIcon(): string
	{
		return this.#icon;
	}

	setWithSearch(value: boolean): void
	{
		this.#withSearch = value === true;
		this.#updateRightIconElement(this.#searchElement, this.#withSearch);
	}

	getWithSearch(): boolean
	{
		return this.#withSearch;
	}

	getWithClear(): boolean
	{
		return this.#withClear;
	}

	setWithClear(value: boolean): void
	{
		this.#withClear = value === true;
		this.#updateRightIconElement(this.#clearElement, this.#withClear);
	}

	isDropdown(): boolean
	{
		return this.#dropdown;
	}

	setDropdown(value: boolean): void
	{
		this.#dropdown = value === true;
		this.#updateRightIconElement(this.#dropdownElement, this.#dropdown);
	}

	isFocused(): boolean
	{
		return this.#focused;
	}

	setFocused(value: boolean): void
	{
		this.#focused = value === true;
		this.#updateClasses();
	}

	isLabelInline(): boolean
	{
		return this.#labelInline;
	}

	setLabelInline(value: boolean): void
	{
		this.#labelInline = value === true;

		if (this.#labelInline)
		{
			Dom.addClass(this.#labelElement, '--inline');
		}
		else
		{
			Dom.removeClass(this.#labelElement, '--inline');
		}
	}

	addChip(chipOptions: ChipOptions): void
	{
		this.#chips.push(chipOptions);
		this.#updateChips();
	}

	removeChip(chipOptions: ChipOptions): void
	{
		this.#chips = this.#chips.filter((item) => item !== chipOptions);
		this.#updateChips();
	}

	removeChips(): void
	{
		this.#chips = [];
		this.#updateChips();
	}

	getChips(): Array<Chip>
	{
		return this.#chipsInstances;
	}

	#updateClasses(): void
	{
		if (!this.#wrapper)
		{
			return;
		}

		this.#wrapper.className = `ui-system-input ${this.#getWrapperClasses()}`;
	}

	#renderLabel(): HTMLElement
	{
		this.#labelElement = Tag.render`
			<div class="ui-system-input-label ${this.#labelInline ? '--inline' : ''}">
				${this.#label ?? ''}
			</div>
		`;

		return this.#labelElement;
	}

	#renderChips(): HTMLElement
	{
		this.#chipsContainer = Tag.render`<div class="ui-system-input-chips"></div>`;
		this.#updateChips();

		return this.#chipsContainer;
	}

	#updateChips(): void
	{
		this.#chipElements = [];
		this.#chipsInstances = [];
		Dom.clean(this.#chipsContainer);

		if (this.#chips && this.#chips.length > 0)
		{
			this.#chips.forEach((chipOptions) => {
				const chip = new Chip({
					...chipOptions,
					size: this.#getChipSize(),
					design: this.#isDisabled() ? ChipDesign.Disabled : (chipOptions.design ?? ChipDesign.Outline),
					onClick: (event) => {
						this.#onChipClick?.(chipOptions, event);
					},
					onClear: (event) => {
						this.#onChipClear?.(chipOptions, event);
					},
				});

				const chipWrapper = Tag.render`<div class="ui-system-input-chip">${chip.render()}</div>`;
				Dom.append(chipWrapper, this.#chipsContainer);

				this.#chipsInstances.push(chip);
				this.#chipElements.push(chipWrapper);
			});
		}
	}

	#renderIcon(): HTMLElement
	{
		this.#iconElement = Tag.render`<div class="ui-system-input-icon"></div>`;
		this.#updateIcon();

		return this.#iconElement;
	}

	#updateIcon(): void
	{
		if (!this.#iconElement)
		{
			return;
		}

		if (this.#icon)
		{
			this.#iconElement.removeAttribute('hidden');
			this.#iconElement.className = `ui-system-input-icon ui-icon-set --${this.#icon}`;
		}
		else
		{
			this.#iconElement.className = 'ui-system-input-icon';
			Dom.attr(this.#iconElement, { hidden: '' });
		}
	}

	#renderSearchIcon(): HTMLElement
	{
		this.#searchElement = Tag.render`<div class="ui-system-input-cross --${Outline.SEARCH}"></div>`;
		this.#updateRightIconElement(this.#searchElement, this.#withSearch);

		return this.#searchElement;
	}

	#renderClearIcon(): HTMLElement
	{
		this.#clearElement = Tag.render`<div class="ui-system-input-cross --clear --${Outline.CROSS_L}"></div>`;
		this.#updateRightIconElement(this.#clearElement, this.#withClear);

		return this.#clearElement;
	}

	#renderDropdownIcon(): HTMLElement
	{
		this.#dropdownElement = Tag.render`
			<div class="ui-system-input-dropdown --${Outline.CHEVRON_DOWN_L}"></div>
		`;
		this.#updateRightIconElement(this.#dropdownElement, this.#dropdown);

		return this.#dropdownElement;
	}

	#updateRightIconElement(iconElement: HTMLElement, isShow: boolean): void
	{
		if (isShow)
		{
			iconElement.removeAttribute('hidden');
			Dom.addClass(iconElement, 'ui-icon-set');
		}
		else
		{
			Dom.removeClass(iconElement, 'ui-icon-set');
			Dom.attr(iconElement, { hidden: '' });
		}
	}

	#renderInput(): HTMLElement
	{
		const commonAttrs = {
			className: 'ui-system-input-value',
			placeholder: this.#placeholder,
			disabled: this.#isDisabled(),
			value: this.#value,
		};

		if (this.#rows > 1)
		{
			this.#inputElement = Tag.render`
				<textarea
					class="${commonAttrs.className} --multi"
					style="resize: ${this.#resize};"
					placeholder="${commonAttrs.placeholder}"
					${commonAttrs.disabled ? 'disabled' : ''}
					rows="${this.#rows}"
				>${commonAttrs.value}</textarea>
			`;
		}
		else
		{
			this.#inputElement = Tag.render`
				<input
					class="${commonAttrs.className}"
					style="--placeholder-length: ${this.#placeholder.length}ch;"
					placeholder="${commonAttrs.placeholder}"
					${commonAttrs.disabled ? 'disabled' : ''}
					value="${commonAttrs.value}"
				/>
			`;
		}

		return this.#inputElement;
	}

	#renderError(): HTMLElement | ''
	{
		this.#errorElement = Tag.render`
			<div ${this.#isDisabled() ? 'hidden' : ''} class="ui-system-input-label --error" title="${this.#error}">
				${this.#error}
			</div>
		`;

		return this.#errorElement;
	}

	#bindEvents(): void
	{
		if (!this.#wrapper || !this.#containerElement)
		{
			return;
		}

		Event.bind(this.#containerElement, 'click', this.#handleContainerClick.bind(this));

		if (this.#inputElement)
		{
			Event.bind(this.#inputElement, 'input', this.#handleInput.bind(this));
			Event.bind(this.#inputElement, 'focus', this.#handleFocus.bind(this));
			Event.bind(this.#inputElement, 'blur', this.#handleBlur.bind(this));
		}

		if (this.#clearElement)
		{
			Event.bind(this.#clearElement, 'click', this.#handleClear.bind(this));
		}
	}

	#handleContainerClick(event: MouseEvent): void
	{
		if (!this.#clickable && this.#inputElement)
		{
			this.#inputElement.focus();
		}

		this.#onClick?.(event);
	}

	#handleInput(event: InputEvent): void
	{
		if (!this.#inputElement)
		{
			return;
		}

		this.#value = this.#inputElement.value;
		this.#onInput?.(event);
	}

	#handleFocus(event: FocusEvent): void
	{
		if (this.#clickable)
		{
			event.target.blur();

			return;
		}

		this.#focused = true;
		Dom.addClass(this.#wrapper, '--active');

		this.#onFocus?.(event);
	}

	#handleBlur(event: FocusEvent): void
	{
		this.#focused = false;
		if (!this.#active)
		{
			Dom.removeClass(this.#wrapper, '--active');
		}

		this.#onBlur?.(event);
	}

	#handleClear(event: MouseEvent): void
	{
		event.stopPropagation();
		this.setValue('');
		this.#onClear?.(event);
	}

	#getWrapperClasses(): string
	{
		return [
			`--${this.#design}`,
			`--${this.#size}`,
			this.#center ? '--center' : '',
			this.#chips.length > 0 ? '--with-chips' : '',
			this.#clickable ? '--clickable' : '',
			this.#stretched ? '--stretched' : '',
			(this.#active || this.#focused) ? '--active' : '',
			(this.#error && !this.#isDisabled()) ? '--error' : '',
		].filter(Boolean).join(' ');
	}

	#getChipSize(): ChipSize
	{
		return {
			[InputSize.Lg]: ChipSize.Md,
			[InputSize.Md]: ChipSize.Md,
			[InputSize.Sm]: ChipSize.Xs,
		}[this.#size] ?? ChipSize.Md;
	}

	#isDisabled(): boolean
	{
		return this.#design === InputDesign.Disabled;
	}

	focus(): void
	{
		if (this.#inputElement && !this.#clickable)
		{
			this.#inputElement.focus({ preventScroll: true });

			if (!Type.isFunction(this.#inputElement.setSelectionRange))
			{
				return;
			}

			const length = this.#value.length;
			this.#inputElement.setSelectionRange(length, length);
		}
	}

	blur(): void
	{
		this.#inputElement?.blur();
	}

	destroy(): void
	{
		if (!this.#wrapper)
		{
			return;
		}

		Event.unbindAll(this.#wrapper);

		if (this.#inputElement)
		{
			Event.unbindAll(this.#inputElement);
		}

		if (this.#clearElement)
		{
			Event.unbindAll(this.#clearElement);
		}

		this.#chipsInstances.forEach((chip) => chip.destroy());
		this.#chipsInstances = [];
		this.#chipElements = [];

		Dom.remove(this.#wrapper);

		this.#wrapper = null;
		this.#labelElement = null;
		this.#containerElement = null;
		this.#inputElement = null;
		this.#errorElement = null;
		this.#iconElement = null;
		this.#clearElement = null;
		this.#searchElement = null;
		this.#dropdownElement = null;
	}
}
