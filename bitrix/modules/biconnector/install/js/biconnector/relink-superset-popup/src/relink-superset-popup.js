import { ajax as Ajax, Loc, Tag, Text, Type, Dom, bind } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import 'ui.design-tokens';

import './style.css';

const ACTION_TRANSFER = 'transfer';
const ACTION_CREATE_NEW = 'create_new';
const ACTION_DISABLE = 'disable';

export class RelinkSupersetPopup
{
	#dialog: Dialog;
	#selectedAction: ?string = null;
	#cards: Map<string, HTMLElement> = new Map();
	#applyButton: Button;
	#isLoading: boolean = false;

	constructor()
	{
		this.#dialog = this.#createDialog();
	}

	show(): void
	{
		this.#dialog.show();
	}

	hide(): void
	{
		this.#dialog.hide();
	}

	#createDialog(): Dialog
	{
		this.#applyButton = new Button({
			text: Loc.getMessage('BICONNECTOR_RELINK_POPUP_APPLY_BTN'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				this.#handleApply();
			},
		});
		this.#applyButton.setDisabled();

		const cancelButton = new Button({
			text: Loc.getMessage('BICONNECTOR_RELINK_POPUP_CANCEL_BTN'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			onclick: () => {
				this.hide();
			},
		});

		return new Dialog({
			title: Loc.getMessage('BICONNECTOR_RELINK_POPUP_TITLE'),
			content: this.#renderContent(),
			width: 500,
			hasOverlay: true,
			centerButtons: [this.#applyButton, cancelButton],
		});
	}

	#renderContent(): HTMLElement
	{
		return Tag.render`
			<div class="biconnector-relink-popup-content">
				${this.#renderCard(
					ACTION_TRANSFER,
					Loc.getMessage('BICONNECTOR_RELINK_POPUP_TRANSFER_TITLE'),
					Loc.getMessage('BICONNECTOR_RELINK_POPUP_TRANSFER_DESCRIPTION'),
				)}
				${this.#renderCard(
					ACTION_CREATE_NEW,
					Loc.getMessage('BICONNECTOR_RELINK_POPUP_CREATE_NEW_TITLE'),
					Loc.getMessage('BICONNECTOR_RELINK_POPUP_CREATE_NEW_DESCRIPTION'),
				)}
				${this.#renderCard(
					ACTION_DISABLE,
					Loc.getMessage('BICONNECTOR_RELINK_POPUP_DISABLE_TITLE'),
					Loc.getMessage('BICONNECTOR_RELINK_POPUP_DISABLE_DESCRIPTION'),
				)}
			</div>
		`;
	}

	#renderCard(action: string, title: string, description: string): HTMLElement
	{
		const isSelected = this.#selectedAction === action;

		const card = Tag.render`
			<div class="biconnector-relink-popup-card ${isSelected ? '--selected' : ''}">
				<div class="biconnector-relink-popup-card-radio">
					<div class="biconnector-relink-popup-card-radio-inner ${isSelected ? '--checked' : ''}"></div>
				</div>
				<div class="biconnector-relink-popup-card-content">
					<div class="biconnector-relink-popup-card-title">${title}</div>
					<div class="biconnector-relink-popup-card-description">${description}</div>
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

			const radioInner = card.querySelector('.biconnector-relink-popup-card-radio-inner');
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

	#setLoading(loading: boolean): void
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

		this.#setLoading(true);

		switch (this.#selectedAction)
		{
			case ACTION_TRANSFER:
				this.#transferSuperset();
				break;
			case ACTION_CREATE_NEW:
				this.#createNewSuperset();
				break;
			case ACTION_DISABLE:
				this.#disableSuperset();
				break;
		}
	}

	#transferSuperset(): void
	{
		Ajax.runAction('biconnector.superset.linkAddress').then(() => {
			location.reload();
		}).catch((response) => {
			this.#processErrorResponse(response);
		});
	}

	#createNewSuperset(): void
	{
		Ajax.runAction('biconnector.superset.deleteLocal').then(() => {
			location.reload();
		}).catch((response) => {
			this.#processErrorResponse(response);
		});
	}

	#disableSuperset(): void
	{
		Ajax.runAction('biconnector.superset.deleteLocal', {
			data: {
				disableTool: true,
			},
		}).then(() => {
			location.reload();
		}).catch((response) => {
			this.#processErrorResponse(response);
		});
	}

	#processErrorResponse(response): void
	{
		if (response.errors && Type.isStringFilled(response.errors[0]?.message))
		{
			BX.UI.Notification.Center.notify({
				content: Text.encode(response.errors[0].message),
			});
		}

		this.#setLoading(false);
	}
}
