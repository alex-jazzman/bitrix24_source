import { Tag, Loc, Dom } from 'main.core';
import { PopupWindowButton } from 'main.popup';
import { InfoHelper } from 'ui.info-helper';
import { VisuallyHidden } from 'ui.a11y';

const RESTRICTION_ID = 'theme-dialog-checkbox-restriction';

export class CheckboxButton extends PopupWindowButton
{
	#themePicker: BX.Intranet.Bitrix24.ThemePicker;
	#checkbox: HTMLInputElement;

	constructor(themePicker: BX.Intranet.Bitrix24.ThemePicker)
	{
		super({ id: 'checkbox' });

		this.#themePicker = themePicker;
		this.#checkbox = Tag.render`
			<input
				id="theme-dialog-checkbox-input"
				class="theme-dialog-checkbox-input"
				data-testid="bx-theme-picker-default-for-all"
				type="checkbox"
				name="defaultTheme"
				value="Y"
				onclick="${this.#handleCheckboxClick.bind(this)}"
			>
		`;

		const restricted = !this.#themePicker.canSetDefaultTheme();
		if (restricted)
		{
			// `aria-disabled` instead of the native one: the click still has to open the tariff banner.
			Dom.attr(this.#checkbox, { 'aria-disabled': 'true', 'aria-describedby': RESTRICTION_ID });
		}

		this.buttonNode = Tag.render`
			<div class="theme-dialog-checkbox-button">
				${this.#checkbox}
				<label for="theme-dialog-checkbox-input" class="theme-dialog-checkbox-label">
					${Loc.getMessage('BITRIX24_THEME_DEFAULT_THEME_FOR_ALL')}
				</label>
				${restricted ? this.#createRestriction() : ''}
			</div>
		`;
	}

	isChecked(): boolean
	{
		return this.#checkbox.checked;
	}

	check(): void
	{
		this.#checkbox.checked = true;
	}

	uncheck(): void
	{
		this.#checkbox.checked = false;
	}

	/**
	 * The lock icon says it visually, the description says the same thing to a screen reader.
	 *
	 * `aria-hidden` on the description: the name and description computation follows a hidden node,
	 * so the checkbox keeps its description, while the node itself stops being a text node of the
	 * tree - and the same phrase stops being read a second time on the way through the footer.
	 */
	#createRestriction(): HTMLElement[]
	{
		const description = new VisuallyHidden();
		description.id = RESTRICTION_ID;
		description.textContent = Loc.getMessage('BITRIX24_THEME_DEFAULT_THEME_FOR_ALL_RESTRICTED');
		Dom.attr(description, 'aria-hidden', 'true');

		return [
			Tag.render`<span class="tariff-lock" aria-hidden="true"></span>`,
			description,
		];
	}

	#handleCheckboxClick(): void
	{
		if (this.#themePicker.canSetDefaultTheme())
		{
			return;
		}

		InfoHelper.show('limit_office_background_to_all');

		this.uncheck();
	}
}
