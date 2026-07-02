/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, currency_currencyCore) {
	'use strict';

	const MARKER = 'catalog-money-edit';
	const DEFAULT_DECIMALS = 2;
	class AdminMoneyField {
		#bound = false;
		init() {
			if (this.#bound) {
				return;
			}
			this.#bound = true;
			main_core.Event.bind(document, 'change', this.#handleChange, true);
			main_core.Event.bind(document, 'submit', this.#handleSubmit, true);
		}
		#toElement(target) {
			return main_core.Type.isElementNode(target) ? target : null;
		}
		#getDecimals(currency) {
			if (!main_core.Type.isStringFilled(currency)) {
				return DEFAULT_DECIMALS;
			}
			const format = currency_currencyCore.CurrencyCore.getCurrencyFormat(currency) || null;
			if (format) {
				if (main_core.Type.isNumber(format.DECIMALS)) {
					return format.DECIMALS;
				}
				if (main_core.Type.isStringFilled(format.DECIMALS)) {
					const parsed = Number.parseInt(format.DECIMALS, 10);
					if (!Number.isNaN(parsed)) {
						return parsed;
					}
				}
			}
			return DEFAULT_DECIMALS;
		}
		#parseAmount(value) {
			const normalized = String(value ?? '').replace(/\s/g, '').replace(',', '.');
			if (normalized === '') {
				return null;
			}
			const num = Number.parseFloat(normalized);
			return Number.isNaN(num) ? null : num;
		}
		#format(rawValue, currency) {
			const num = this.#parseAmount(rawValue);
			if (num === null) {
				return '';
			}
			return num.toFixed(this.#getDecimals(currency));
		}
		#getCurrencyControl(input) {
			const id = input.getAttribute('data-money-currency-source');
			if (!main_core.Type.isStringFilled(id)) {
				return null;
			}
			return document.getElementById(id);
		}
		#getCurrency(input) {
			const control = this.#getCurrencyControl(input);
			return control ? String(control.value || '') : '';
		}
		#isMoneyInput(element) {
			return element !== null && element.tagName === 'INPUT' && element.classList.contains(MARKER);
		}
		#getMoneyInputs(scope) {
			return Array.from(scope.getElementsByClassName(MARKER));
		}
		#normalizeRaw(input) {
			const num = this.#parseAmount(input.value);
			input.setAttribute('data-money-raw', num === null ? '' : String(num));
		}
		#reformat(input, currency) {
			const raw = input.getAttribute('data-money-raw');
			input.value = main_core.Type.isStringFilled(raw) ? this.#format(raw, currency) : '';
		}
		#restoreRawForSubmit(input) {
			const raw = input.getAttribute('data-money-raw');
			if (!main_core.Type.isStringFilled(raw)) {
				return;
			}
			if (!main_core.Type.isStringFilled(String(input.value).replace(/\s/g, ''))) {
				return;
			}
			const current = this.#parseAmount(input.value);
			const rawNum = this.#parseAmount(raw);
			if (current === null || rawNum === null) {
				return;
			}
			const decimals = this.#getDecimals(this.#getCurrency(input));
			if (current.toFixed(decimals) === rawNum.toFixed(decimals)) {
				input.value = raw;
			}
		}
		#ensureFormat(currency, callback) {
			if (!main_core.Type.isStringFilled(currency) || currency_currencyCore.CurrencyCore.getCurrencyFormat(currency)) {
				callback();
				return;
			}
			const result = currency_currencyCore.CurrencyCore.loadCurrencyFormat(currency);
			if (result && main_core.Type.isFunction(result.then)) {
				result.then(callback, callback);
				return;
			}
			callback();
		}
		#handleChange = event => {
			const target = this.#toElement(event.target);
			if (this.#isMoneyInput(target)) {
				this.#normalizeRaw(target);
				return;
			}
			if (target === null || !main_core.Type.isStringFilled(target.id)) {
				return;
			}
			const sourceId = target.id;
			const matched = Array.from(document.querySelectorAll(`input.${MARKER}[data-money-currency-source="${sourceId}"]`));
			if (matched.length === 0) {
				return;
			}
			const currency = String(target.value || '');
			this.#ensureFormat(currency, () => {
				matched.forEach(input => this.#reformat(input, currency));
			});
		};
		#handleSubmit = event => {
			const form = this.#toElement(event.target);
			if (form === null || form.tagName !== 'FORM') {
				return;
			}
			const inputs = this.#getMoneyInputs(form);
			inputs.forEach(input => this.#restoreRawForSubmit(input));
			setTimeout(() => {
				inputs.forEach(input => this.#reformat(input, this.#getCurrency(input)));
			}, 0);
		};
	}
	const adminMoneyField = new AdminMoneyField();
	adminMoneyField.init();

	exports.AdminMoneyField = AdminMoneyField;
	exports.adminMoneyField = adminMoneyField;

})(this.BX.Catalog = this.BX.Catalog || {}, BX, BX.Currency);
//# sourceMappingURL=admin-money-field.bundle.js.map
