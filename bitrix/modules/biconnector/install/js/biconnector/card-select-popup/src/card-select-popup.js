import { Loc, Tag, Dom, bind } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import 'ui.design-tokens';

import './style.css';

export class CardSelectPopup
{
	#dialog: Dialog;
	#selectedAction: ?string = null;
	#cards: Map<string, HTMLElement> = new Map();
	#applyButton: Button;
	#isLoading: boolean = false;
	#applyCallback: ?Function = null;
	#cancelCallback: ?Function = null;

	constructor(options: {
		title: string,
		cards: Array<{id: string, title: string, description: string}>,
		applyButtonText?: string,
		cancelButtonText?: string,
	})
	{
		this.options = options;
		this.#dialog = this.#createDialog();
		this.#dialog.subscribe('onHide', () => {
			this.#cancelCallback?.();
		});
	}

	show(onApply: Function, onCancel: ?Function = null): void
	{
		this.#applyCallback = onApply;
		this.#cancelCallback = onCancel;
		this.#dialog.show();
	}

	hide(): void
	{
		this.#dialog.hide();
	}

	#createDialog(): Dialog
	{
		this.#applyButton = new Button({
			text: this.options.applyButtonText || Loc.getMessage('BICONNECTOR_CARD_SELECT_POPUP_APPLY_BTN'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				this.#handleApply();
			},
		});
		this.#applyButton.setDisabled();

		const cancelButton = new Button({
			text: this.options.cancelButtonText || Loc.getMessage('BICONNECTOR_CARD_SELECT_POPUP_CANCEL_BTN'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			onclick: () => {
				this.#handleCancel();
			},
		});

		return new Dialog({
			title: this.options.title,
			content: this.#renderContent(),
			width: 500,
			hasOverlay: true,
			centerButtons: [this.#applyButton, cancelButton],
		});
	}

	#renderContent(): HTMLElement
	{
		const cards = this.options.cards.map((card) => {
			return this.#renderCard(card.id, card.title, card.description);
		});

		return Tag.render`
			<div class="biconnector-card-select-popup-content">
				${cards}
			</div>
		`;
	}

	#renderCard(action: string, title: string, description: string): HTMLElement
	{
		const isSelected = this.#selectedAction === action;

		const card = Tag.render`
			<div class="biconnector-card-select-popup-card ${isSelected ? '--selected' : ''}">
				<div class="biconnector-card-select-popup-card-radio">
					<div class="biconnector-card-select-popup-card-radio-inner ${isSelected ? '--checked' : ''}"></div>
				</div>
				<div class="biconnector-card-select-popup-card-content">
					<div class="biconnector-card-select-popup-card-title">${title}</div>
					<div class="biconnector-card-select-popup-card-description">${description}</div>
				</div>
			</div>
		`;

		this.#cards.set(action, card);

		bind(card, 'click', () => {
			this.#selectAction(action);
		});

		return card;
	}

	#selectAction(action: string): void
	{
		if (this.#isLoading)
		{
			return;
		}

		this.#selectedAction = action;
		this.#applyButton.setDisabled(false);

		this.#cards.forEach((card, cardAction) => {
			const isSelected = cardAction === action;

			if (isSelected)
			{
				Dom.addClass(card, '--selected');
			}
			else
			{
				Dom.removeClass(card, '--selected');
			}

			const radioInner = card.querySelector('.biconnector-card-select-popup-card-radio-inner');
			if (radioInner)
			{
				if (isSelected)
				{
					Dom.addClass(radioInner, '--checked');
				}
				else
				{
					Dom.removeClass(radioInner, '--checked');
				}
			}
		});
	}

	setLoading(loading: boolean): void
	{
		this.#isLoading = loading;

		this.#cards.forEach((card) => {
			if (loading)
			{
				Dom.addClass(card, '--disabled');
			}
			else
			{
				Dom.removeClass(card, '--disabled');
			}
		});

		this.#applyButton.setWaiting(loading);
	}

	#handleApply(): void
	{
		if (this.#selectedAction === null || this.#isLoading)
		{
			return;
		}

		this.#applyCallback?.(this.#selectedAction);
	}

	#handleCancel(): void
	{
		this.hide();
	}
}
