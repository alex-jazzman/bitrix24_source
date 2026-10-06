/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, ui_designTokens, disk_onlyofficeSessionRestrictions) {
	'use strict';

	class Settings {
		static getSessionBoostServiceCode() {
			return this.getExtensionParam('sessionBoostServiceCode');
		}
		static getAvailableServices() {
			return this.getExtensionParam('availableServices');
		}
		static canDisplay() {
			return this.getExtensionParam('canDisplay');
		}
		static getExtensionParam(parameterName) {
			return main_core.Extension.getSettings('disk.promo-boost').get(parameterName);
		}
	}

	class Checker {
		static isServiceAvailable(code) {
			return Settings.getAvailableServices().includes(code);
		}

		/**
		 * @returns {boolean}
		 */
		static isSessionBoostAvailable() {
			return Settings.canDisplay() && this.isServiceAvailable(Settings.getSessionBoostServiceCode());
		}

		/**
		 * @deprecated
		 * @returns {false|boolean|*}
		 */
		static shouldShowPromoSessionBoost() {
			return this.isSessionBoostAvailable() && disk_onlyofficeSessionRestrictions.DocumentEditSessionLimit.getInstance().isExceeded();
		}
	}

	class Widget {
		static #instance = null;
		#service = '';
		#widgetInstance = null;
		constructor(service) {
			this.#service = service;
		}
		static getInstance(service) {
			if (this.#instance === null) {
				this.#instance = new Widget(service);
			}
			return this.#instance;
		}

		/**
		 * @returns {Promise<ServiceWidget>} -- ServiceWidget from baas.store extension
		 */
		#getBaasWidget() {
			if (this.#widgetInstance !== null) {
				return Promise.resolve(this.#widgetInstance);
			}
			return main_core.loadExt('baas.store').then(exports => {
				this.#widgetInstance = exports.ServiceWidget.getInstanceByCode(this.#service);
				return this.#widgetInstance;
			}).catch(err => {
				const errorMessage = `Baas extension not loaded! Original error: ${err.message}`;
				throw new Error(errorMessage);
			});
		}
		bindTo(node) {
			this.#getBaasWidget().then(widget => {
				widget.bind(node);
			}).catch(this.#errToConsole);
			return this;
		}
		show() {
			this.#getBaasWidget().then(widget => {
				if (widget.getPopup().isShown()) {
					const showWidget = () => {
						widget.show();
						widget.getPopup().unsubscribe('onAfterClose', showWidget);
					};
					widget.getPopup().subscribe('onAfterClose', showWidget);
				} else {
					widget.show();
				}
			}).catch(this.#errToConsole);
			return this;
		}
		toggle() {
			this.#getBaasWidget().then(widget => {
				widget.toggle();
			}).catch(this.#errToConsole);
			return this;
		}
		setOverlay() {
			this.#getBaasWidget().then(widget => {
				widget.getPopup().setOverlay({
					opacity: 0
				});
			}).catch(this.#errToConsole);
			return this;
		}
		#errToConsole(error) {
			console.error(error.message);
		}
	}

	class Button {
		#service = null;
		#container = null;
		#selector = null;
		#uninitialized = true;
		#button = null;
		#node = null;
		#widget;
		constructor(options = {}) {
			this.#service = options.service ?? '';
			this.#widget = options.widget;
			if (main_core.Type.isStringFilled(options.selector)) {
				this.#selector = options.selector;
			} else {
				this.#container = document.getElementById(options.containerId);
			}
		}
		init() {
			if (this.#isBindMode()) {
				this.#initBind();
				return;
			}
			if (this.#uninitialized && this.#checkServiceAvailability()) {
				this.#uninitialized = false;
				if (this.#renderTo()) {
					this.#bindEvent();
				}
			}
		}
		showWidget() {
			this.#widget.bindTo(this.#getTarget());
			this.#widget.show();
		}
		setOverlayToWidget() {
			this.#widget.setOverlay();
		}
		#isBindMode() {
			return this.#selector !== null;
		}
		#initBind() {
			if (!this.#uninitialized) {
				return;
			}
			const node = document.querySelector(this.#selector);
			if (!main_core.Type.isElementNode(node)) {
				return;
			}
			this.#uninitialized = false;
			if (this.#checkServiceAvailability()) {
				this.#node = node;
				main_core.Dom.prepend(main_core.Tag.render`<span class="ui-icon-set --s-rocket" aria-hidden="true"></span>`, node);
				main_core.Event.bind(node, 'click', this.#click.bind(this));
			} else {
				main_core.Dom.remove(node);
			}
		}
		#checkServiceAvailability() {
			return Checker.isServiceAvailable(this.#service);
		}
		#renderTo() {
			if (!main_core.Type.isElementNode(this.#container)) {
				console.error('Disk: BoostButton: Container for service does not exist!');
			}
			main_core.Dom.append(this.#getButton(), this.#container);
			return true;
		}
		#bindEvent() {
			main_core.Event.bind(this.#getButton(), 'click', this.#click.bind(this));
		}
		#click() {
			this.#widget.bindTo(this.#getTarget());
			this.#widget.show();
		}
		#getTarget() {
			return this.#isBindMode() ? this.#node : this.#getButton();
		}
		#getButton() {
			if (!this.#button) {
				// noinspection JSAnnotator
				const text = main_core.Loc.getMessage('DISK_PROMO_BOOST_BUTTON_TEXT');
				this.#button = main_core.Tag.render`<button class="bx-disk-promo-boost-button"><span>${text}</span></button>`;
			}
			return this.#button;
		}
	}

	class Factory {
		static getSessionBoostButton(containerId) {
			return new Button({
				containerId,
				service: Settings.getSessionBoostServiceCode(),
				widget: this.getSessionBoostWidget()
			});
		}
		static getToolbarSessionBoostButton(selector) {
			return new Button({
				selector,
				service: Settings.getSessionBoostServiceCode(),
				widget: this.getSessionBoostWidget()
			});
		}
		static getSessionBoostWidget() {
			return Widget.getInstance(Settings.getSessionBoostServiceCode());
		}
	}

	exports.Button = Button;
	exports.Checker = Checker;
	exports.Factory = Factory;
	exports.Widget = Widget;

})(this.BX.Disk.PromoBoost = this.BX.Disk.PromoBoost || {}, BX, window, BX.Disk.OnlyOfficeSessionRestrictions);
//# sourceMappingURL=promo-boost.bundle.js.map
