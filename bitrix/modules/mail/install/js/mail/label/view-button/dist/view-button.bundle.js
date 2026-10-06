/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Label = this.BX.Mail.Label || {};
(function (exports, main_core) {
	'use strict';

	const BUTTON_SELECTOR = '[data-role="mail-label-assign"]';
	class ViewLabelButton {
		static #bound = false;
		static #isOpening = false;
		static init() {
			if (this.#bound) {
				return;
			}
			this.#bound = true;
			main_core.Event.bind(document.body, 'click', this.#handleClick);
		}
		static #handleClick = event => {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			const button = target.closest(BUTTON_SELECTOR);
			if (!(button instanceof HTMLElement)) {
				return;
			}
			const uidKey = button.dataset.uidKey;
			if (!uidKey) {
				return;
			}
			if (this.#isOpening) {
				return;
			}
			this.#isOpening = true;
			void main_core.Runtime.loadExtension('mail.label.assign-menu').then(exports => exports.AssignMenu.show({
				bindElement: button,
				messageIds: [uidKey],
				currentLabelIds: this.#parseLabelIds(button.dataset.labelIds),
				mailboxId: this.#parseMailboxId(uidKey),
				onChange: change => this.#updateButtonState(button, change),
				onShow: () => main_core.Dom.attr(button, 'aria-expanded', 'true'),
				onClose: () => main_core.Dom.attr(button, 'aria-expanded', 'false')
			})).catch(() => this.#notifyError()).finally(() => {
				this.#isOpening = false;
			});
		};
		static #notifyError() {
			const message = main_core.Loc.getMessage('MAIL_LABEL_VIEW_BUTTON_ERROR') ?? '';
			void main_core.Runtime.loadExtension('ui.notification', 'ui.a11y').then(exports => {
				BX.UI.Notification.Center.notify({
					content: message,
					position: 'top-right',
					autoHideDelay: 3000
				});
				const announcer = exports.LiveAnnouncer;
				announcer?.announce(message, 'assertive');
			}).catch(() => {});
		}
		static #parseMailboxId(uidKey) {
			const mailboxId = Number(uidKey.split('-').pop());
			return Number.isInteger(mailboxId) && mailboxId > 0 ? mailboxId : null;
		}
		static #parseLabelIds(raw) {
			if (!raw) {
				return [];
			}
			try {
				const parsed = JSON.parse(raw);
				return Array.isArray(parsed) ? parsed.map(id => Number(id)) : [];
			} catch {
				return [];
			}
		}
		static #updateButtonState(button, change) {
			const ids = new Set(this.#parseLabelIds(button.dataset.labelIds));
			if (change.assigned) {
				ids.add(change.labelId);
			} else {
				ids.delete(change.labelId);
			}
			main_core.Dom.attr(button, 'data-label-ids', JSON.stringify([...ids]));
		}
	}

	exports.ViewLabelButton = ViewLabelButton;

})(this.BX.Mail.Label.ViewButton = this.BX.Mail.Label.ViewButton || {}, BX);
//# sourceMappingURL=view-button.bundle.js.map
