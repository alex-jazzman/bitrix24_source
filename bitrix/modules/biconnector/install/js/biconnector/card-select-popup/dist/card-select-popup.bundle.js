/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_system_dialog, ui_buttons) {
	'use strict';

	class CardSelectPopup {
		#dialog;
		#selectedAction = null;
		#cards = new Map();
		#applyButton;
		#isLoading = false;
		#applyCallback = null;
		#cancelCallback = null;
		constructor(options) {
			this.options = options;
			this.#dialog = this.#createDialog();
			this.#dialog.subscribe('onHide', () => {
				this.#cancelCallback?.();
			});
		}
		show(onApply, onCancel = null) {
			this.#applyCallback = onApply;
			this.#cancelCallback = onCancel;
			this.#dialog.show();
		}
		hide() {
			this.#dialog.hide();
		}
		#createDialog() {
			this.#applyButton = new ui_buttons.Button({
				text: this.options.applyButtonText || main_core.Loc.getMessage('BICONNECTOR_CARD_SELECT_POPUP_APPLY_BTN'),
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => {
					this.#handleApply();
				}
			});
			this.#applyButton.setDisabled();
			const cancelButton = new ui_buttons.Button({
				text: this.options.cancelButtonText || main_core.Loc.getMessage('BICONNECTOR_CARD_SELECT_POPUP_CANCEL_BTN'),
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				onclick: () => {
					this.#handleCancel();
				}
			});
			return new ui_system_dialog.Dialog({
				title: this.options.title,
				content: this.#renderContent(),
				width: 500,
				hasOverlay: true,
				centerButtons: [this.#applyButton, cancelButton]
			});
		}
		#renderContent() {
			const cards = this.options.cards.map(card => {
				return this.#renderCard(card.id, card.title, card.description);
			});
			return main_core.Tag.render`
			<div class="biconnector-card-select-popup-content">
				${cards}
			</div>
		`;
		}
		#renderCard(action, title, description) {
			const isSelected = this.#selectedAction === action;
			const card = main_core.Tag.render`
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
			main_core.bind(card, 'click', () => {
				this.#selectAction(action);
			});
			return card;
		}
		#selectAction(action) {
			if (this.#isLoading) {
				return;
			}
			this.#selectedAction = action;
			this.#applyButton.setDisabled(false);
			this.#cards.forEach((card, cardAction) => {
				const isSelected = cardAction === action;
				if (isSelected) {
					main_core.Dom.addClass(card, '--selected');
				} else {
					main_core.Dom.removeClass(card, '--selected');
				}
				const radioInner = card.querySelector('.biconnector-card-select-popup-card-radio-inner');
				if (radioInner) {
					if (isSelected) {
						main_core.Dom.addClass(radioInner, '--checked');
					} else {
						main_core.Dom.removeClass(radioInner, '--checked');
					}
				}
			});
		}
		setLoading(loading) {
			this.#isLoading = loading;
			this.#cards.forEach(card => {
				if (loading) {
					main_core.Dom.addClass(card, '--disabled');
				} else {
					main_core.Dom.removeClass(card, '--disabled');
				}
			});
			this.#applyButton.setWaiting(loading);
		}
		#handleApply() {
			if (this.#selectedAction === null || this.#isLoading) {
				return;
			}
			this.#applyCallback?.(this.#selectedAction);
		}
		#handleCancel() {
			this.hide();
		}
	}

	exports.CardSelectPopup = CardSelectPopup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI.System, BX.UI);
//# sourceMappingURL=card-select-popup.bundle.js.map
