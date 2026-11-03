/* eslint-disable */
this.BX = this.BX || {};
this.BX.Salescenter = this.BX.Salescenter || {};
(function (exports, main_core_events, sale_paymentPay_const, sale_userConsentA11y) {
	'use strict';

	class UserConsent {
		/**
		 * @public
		 * @param {object} options
		 */
		constructor(options) {
			this.options = options || {};
			this.eventName = this.option('eventName', false);
			this.items = this.option('items', []);
			this.preselectedConsentsIsSubmitted = false;
			this.setCallback(null);
			this.subscribeToEvents();
		}
		setCallback(callback) {
			this.callback = callback;
		}
		runCallback() {
			if (this.callback) {
				this.callback();
			}
			this.setCallback(null);
		}

		/**
		 * @private
		 */
		subscribeToEvents() {
			main_core_events.EventEmitter.subscribe(sale_paymentPay_const.EventType.consent.accepted, event => {
				const currentId = event.getData()[0].config.id;
				const currentItem = this.getItemById(currentId);
				if (currentItem) {
					currentItem.checked = 'Y';
				}
				const firstRequiredUncheckedItem = this.getFirstRequiredUncheckedItem();
				if (firstRequiredUncheckedItem && this.callback) {
					main_core_events.EventEmitter.emit(`${this.eventName}-${firstRequiredUncheckedItem.id}`);
					return;
				}
				this.runCallback();
			});
			main_core_events.EventEmitter.subscribe(sale_paymentPay_const.EventType.consent.refused, event => {
				const currentId = event.getData()[0].config.id;
				const currentItem = this.getItemById(currentId);
				if (currentItem) {
					currentItem.checked = 'N';
				}
				this.setCallback(null);
			});
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isAvailable() {
			return BX.UserConsent && this.eventName;
		}

		/**
		 * @public
		 * @param callback
		 */
		askUserToPerform(callback) {
			this.setCallback(callback);

			// the consent dialog is opened by the main module, and only this side knows what was pressed
			sale_userConsentA11y.UserConsentPopupAccessibility.setInitiator(document.activeElement);
			if (!this.isAvailable()) {
				this.runCallback();
				return;
			}
			if (!this.preselectedConsentsIsSubmitted) {
				this.sendEventsForCheckedConsents();
				this.preselectedConsentsIsSubmitted = true;
			}
			const firstRequiredUncheckedItem = this.getFirstRequiredUncheckedItem();
			if (firstRequiredUncheckedItem) {
				main_core_events.EventEmitter.emit(`${this.eventName}-${firstRequiredUncheckedItem.id}`);
				return;
			}
			this.runCallback();
		}
		sendEventsForCheckedConsents() {
			this.items.forEach(item => {
				if (item.checked === 'Y') {
					main_core_events.EventEmitter.emit(`${this.eventName}-${item.id}`);
				}
			});
		}
		getFirstRequiredUncheckedItem() {
			return this.items.find(item => item.required === 'Y' && item.checked === 'N') ?? null;
		}
		getItemById(currentId) {
			return this.items.find(item => parseInt(item.id, 10) === currentId) ?? null;
		}

		/**
		 * @private
		 * @param {string} name
		 * @param defaultValue
		 * @returns {*}
		 */
		option(name, defaultValue) {
			return Object.hasOwn(this.options, name) ? this.options[name] : defaultValue;
		}
	}

	exports.UserConsent = UserConsent;

})(this.BX.Salescenter.PaymentPay = this.BX.Salescenter.PaymentPay || {}, BX.Event, BX.Sale.PaymentPay.Const, BX.Sale);
//# sourceMappingURL=user-consent.bundle.js.map
