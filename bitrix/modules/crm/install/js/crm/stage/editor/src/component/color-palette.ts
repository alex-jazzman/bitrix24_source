import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { Input, InputDesign, InputSize } from 'ui.system.input';
import 'ui.icon-set.outline';
import { getStageTextColor, normalizeStageColor } from 'crm.stage.color';

import {
	StageEditorPalette,
	isStageEditorPaletteColor,
} from '../lib/palette';

type ColorPaletteOptions = {
	selectedColor: string,
	onSelect: (color: string) => void,
};

export class ColorPalette
{
	#selectedColor: string;
	#onSelect: (color: string) => void;
	#container: HTMLElement | null = null;
	#customToggle: HTMLElement | null = null;
	#customInput: HTMLInputElement | null = null;
	#customField: HTMLElement | null = null;
	#customColorPreview: HTMLElement | null = null;
	#isCustomFieldVisible: boolean;

	/** Keeps the custom field visible until this palette instance is destroyed. */
	#wasCustomFieldOpened: boolean = false;

	constructor(options: ColorPaletteOptions)
	{
		this.#selectedColor = normalizeStageColor(options.selectedColor);
		this.#onSelect = options.onSelect;
		this.#isCustomFieldVisible = this.#wasCustomFieldOpened
			|| !isStageEditorPaletteColor(this.#selectedColor);
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		const container = Tag.render`
			<div
				class="crm-stage-editor-color-palette"
				data-testid="crm-stage-editor-color-palette"
			>
				${this.#renderGrid()}
				${this.#renderCustomColor()}
			</div>
		`;
		this.#container = container;
		this.#syncSelectedState();
		this.#syncCustomInput();
		this.#syncCustomFieldVisibility();

		return container;
	}

	setSelectedColor(color: string): void
	{
		this.#selectedColor = normalizeStageColor(color);
		this.#isCustomFieldVisible = this.#wasCustomFieldOpened
			|| !isStageEditorPaletteColor(this.#selectedColor);
		this.#syncSelectedState();
		this.#syncCustomInput();
		this.#syncCustomFieldVisibility();
	}

	#renderGrid(): HTMLElement
	{
		const colors = StageEditorPalette.flat();

		return Tag.render`
			<div
				class="crm-stage-editor-color-palette__grid"
				data-testid="crm-stage-editor-color-palette-grid"
				role="group"
				aria-label="${Text.encode(Loc.getMessage('CRM_STAGE_EDITOR_COLOR_PALETTE_LABEL') ?? '')}"
			>
				${colors.map((color) => this.#renderColor(color))}
			</div>
		`;
	}

	#renderColor(color: string): HTMLElement
	{
		const button = Tag.render`
			<button
				class="crm-stage-editor-color-palette__item"
				type="button"
				aria-label="#${color.toUpperCase()}"
				aria-pressed="${color === this.#selectedColor ? 'true' : 'false'}"
				data-color="${color}"
				data-testid="crm-stage-editor-color-option-${color}"
			></button>
		`;

		Dom.style(button, {
			backgroundColor: `#${color}`,
			color: getStageTextColor(color),
		});
		Dom.append(
			this.#renderIcon(
				Outline.CHECK_L,
				14,
				'crm-stage-editor-color-palette__item-check',
				getStageTextColor(color),
			),
			button,
		);
		Event.bind(button, 'click', () => {
			this.#handleColorSelected(color);
		});

		return button;
	}

	#renderCustomColor(): HTMLElement
	{
		const customInputControl = new Input({
			value: `#${this.#selectedColor.toUpperCase()}`,
			placeholder: '#',
			size: InputSize.Md,
			design: InputDesign.LightGrey,
			ariaLabel: Loc.getMessage('CRM_STAGE_EDITOR_CUSTOM_COLOR_LABEL') ?? '',
		});
		const customInputWrapper = customInputControl.render();
		Dom.addClass(customInputWrapper, 'crm-stage-editor-color-palette__custom-input');

		this.#customInput = customInputWrapper.querySelector<HTMLInputElement>('input');
		if (this.#customInput)
		{
			this.#customInput.dataset.testid = 'crm-stage-editor-color-custom-input';
			this.#customInput.maxLength = 7;
			Event.bind(this.#customInput, 'change', this.#handleCustomColorChange);
			Event.bind(this.#customInput, 'keydown', this.#handleCustomColorKeyDown);
		}

		this.#customColorPreview = Tag.render`
			<span
				class="crm-stage-editor-color-palette__custom-preview"
				data-testid="crm-stage-editor-color-custom-preview"
				aria-hidden="true"
			></span>
		`;
		Dom.append(
			this.#customColorPreview,
			customInputWrapper.querySelector<HTMLElement>('.ui-system-input-container'),
		);

		const addCustomColorButton = new Button({
			text: Loc.getMessage('CRM_STAGE_EDITOR_CUSTOM_COLOR_ADD') ?? '',
			icon: Outline.PLUS_L,
			collapsedIcon: ButtonIcon.ADD,
			size: ButtonSize.SMALL,
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			onclick: () => {
				this.#showCustomField();

				return {};
			},
		}).render();
		Dom.addClass(addCustomColorButton, 'crm-stage-editor-color-palette__custom-add');
		addCustomColorButton.dataset.testid = 'crm-stage-editor-color-custom-add';

		this.#customToggle = Tag.render`
			<div class="crm-stage-editor-color-palette__custom-toggle">
				${addCustomColorButton}
			</div>
		`;

		this.#customField = Tag.render`
			<div class="crm-stage-editor-color-palette__custom-field --hidden">
				${customInputWrapper}
			</div>
		`;

		return Tag.render`
			<div class="crm-stage-editor-color-palette__custom">
				${this.#customToggle}
				${this.#customField}
			</div>
		`;
	}

	#handleColorSelected(color: string): void
	{
		if (!isStageEditorPaletteColor(color))
		{
			return;
		}

		this.#selectedColor = normalizeStageColor(color);
		this.#isCustomFieldVisible = this.#wasCustomFieldOpened;
		this.#syncSelectedState();
		this.#syncCustomInput();
		this.#syncCustomFieldVisibility();
		this.#onSelect(this.#selectedColor);
	}

	#handleCustomColorChange = (): void => {
		const input = this.#customInput?.value ?? '';
		const normalizedInput = input.replace(/^#/, '').toLowerCase();
		const color = normalizeStageColor(input, this.#selectedColor);
		if (color !== normalizedInput)
		{
			this.#syncCustomInput();

			return;
		}

		this.#selectedColor = color;
		this.#isCustomFieldVisible = this.#wasCustomFieldOpened || !isStageEditorPaletteColor(color);
		this.#syncSelectedState();
		this.#syncCustomInput();
		this.#syncCustomFieldVisibility();
		this.#onSelect(this.#selectedColor);
	};

	#showCustomField = (): void => {
		this.#wasCustomFieldOpened = true;
		this.#isCustomFieldVisible = true;
		this.#syncCustomFieldVisibility();
		this.#customInput?.focus();
	};

	#handleCustomColorKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter')
		{
			event.preventDefault();
			this.#handleCustomColorChange();
		}
	};

	#syncSelectedState(): void
	{
		this.#container?.querySelectorAll('.crm-stage-editor-color-palette__item').forEach((node) => {
			const item = node as HTMLElement;
			const isSelected = item.dataset.color === this.#selectedColor;
			Dom.toggleClass(item, '--selected', isSelected);
			item.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
		});
	}

	#syncCustomInput(): void
	{
		if (this.#customInput)
		{
			this.#customInput.value = `#${this.#selectedColor.toUpperCase()}`;
		}

		if (this.#customColorPreview)
		{
			Dom.style(this.#customColorPreview, 'backgroundColor', `#${this.#selectedColor}`);
		}
	}

	#syncCustomFieldVisibility(): void
	{
		if (this.#customToggle)
		{
			Dom.toggleClass(this.#customToggle, '--hidden', this.#isCustomFieldVisible);
		}

		if (this.#customField)
		{
			Dom.toggleClass(this.#customField, '--hidden', !this.#isCustomFieldVisible);
		}
	}

	#renderIcon(icon: string, size: number, className: string, color?: string): HTMLElement
	{
		const container = Tag.render`
			<span class="${className}" aria-hidden="true"></span>
		`;
		new Icon({ icon, size, color }).renderTo(container);

		return container;
	}
}
