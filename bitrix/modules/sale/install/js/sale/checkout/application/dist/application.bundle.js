/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sale = this.BX.Sale || {};
(function (exports, ui_vue, sale_checkout_lib, main_core, ui_vue_vuex, sale_checkout_controller, sale_checkout_model, ui_designTokens_air, main_core_events, ui_a11y, sale_checkout_const) {
	'use strict';

	const stageContainer = '.checkout-basket-container';
	const checkoutButtonContainer = '.checkout-btn-container';
	const rejectedField = '.checkout-basket-section-personal-form [aria-invalid="true"]';
	const statusScreen = '.checkout-order-status-successful';
	const statusHeading = '.checkout-order-status-text';
	const statusHeadingId = 'sale-checkout-order-status';
	const orderTitle = '.checkout-order-info > :first-child';
	const orderTitleId = 'sale-checkout-order-title';
	// the screens of a placed order are named by a heading that says what has happened
	const statusStages = new Set([sale_checkout_const.Application.stage.success, sale_checkout_const.Application.stage.payed]);
	// only the answer to the order writes the general errors, and the same answer rewrites the fields it refused
	const orderAnswerMutations = new Set(['application/setErrors', 'application/clearErrors']);
	const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

	/**
	 * A stage without a heading takes the focus on its container rather than past its text to a control.
	 * With the keyboard it goes to the first tab stop: a container focused by script shows no ring.
	 */
	function moveFocusToStage(container) {
		if (!container) {
			return;
		}
		if (ui_a11y.FocusMonitor.Instance.getLastInputModality() === 'keyboard' && ui_a11y.FocusNavigator.focusFirst(container, {
			tabbableOnly: true
		})) {
			return;
		}
		container.setAttribute('tabindex', '-1');
		container.focus();
		if (container === document.activeElement) {
			return;
		}
		container.querySelector(focusableSelector)?.focus();
	}

	/**
	 * The screen of a placed order is a group named by its heading and the number of the order: the reader says
	 * them on the way into the screen, ahead of its first control. That control takes the focus with a ring,
	 * which a focus moved by script after a click does not get on its own. A screen without a control
	 * gives the focus to its heading and stays unnamed.
	 */
	function moveFocusToPlacedOrder(container) {
		const screen = container?.querySelector(statusScreen);
		const heading = screen?.querySelector(statusHeading);
		if (!heading) {
			moveFocusToStage(container);
			return;
		}
		const control = screen.querySelector(focusableSelector);
		if (control) {
			heading.id = heading.id || statusHeadingId;
			const labelledBy = [heading.id];
			const title = screen.querySelector(orderTitle);
			if (title) {
				title.id = title.id || orderTitleId;
				labelledBy.push(title.id);
			}
			screen.setAttribute('role', 'group');
			screen.setAttribute('aria-labelledby', labelledBy.join(' '));
		} else {
			// the focused heading says itself: a group named by it would make the reader say it twice
			screen.removeAttribute('role');
			screen.removeAttribute('aria-labelledby');
		}
		const target = control ?? heading;
		target.focus({
			focusVisible: true
		});
		if (target !== document.activeElement) {
			moveFocusToStage(container);
		}
	}

	/**
	 * A field the server refused is where the buyer has to go next: the reader says its error text from there.
	 */
	function moveFocusToRejectedField(form) {
		form?.querySelector(rejectedField)?.focus();
	}
	ui_vue.BitrixVue.component('sale-checkout-form', {
		data() {
			return {
				stage: sale_checkout_const.Application.stage,
				mode: sale_checkout_const.Application.mode,
				status: sale_checkout_const.Loader.status,
				totalIsShow: 'N'
			};
		},
		computed: {
			checkoutButtonEnabled() {
				const properties = [];
				let list = this.$store.getters['property/getProperty'];
				for (let listKey in list) {
					if (!main_core.Type.isStringFilled(list[listKey].value) && list[listKey].required === 'Y') {
						return false;
					}
					if (!main_core.Type.isStringFilled(list[listKey].value)) {
						continue;
					}
					if (list[listKey].type === sale_checkout_const.Property.type.checkbox && list[listKey].required === 'Y' && list[listKey].value !== 'Y') {
						return false;
					}
					if (list[listKey].type === sale_checkout_const.Property.type.checkbox) {
						continue;
					}
					properties.push(list[listKey].value);
				}
				return properties.length > 0;
			},
			hasPS() {
				const result = [];
				let list = this.$store.getters['pay-system/getPaySystem'];
				list.forEach(fields => {
					if (fields.type !== sale_checkout_const.PaySystem.type.cash) {
						result.push(fields);
					}
				});
				return result.length > 0;
			},
			needCheckConsent() {
				return this.getConsent.items.length > 0;
			},
			getBasket() {
				return this.$store.getters['basket/getBasket'];
			},
			getBasketErrors() {
				return this.$store.getters['basket/getErrors'];
			},
			getOrder() {
				return this.$store.getters['order/getOrder'];
			},
			getProperty() {
				return this.$store.getters['property/getProperty'];
			},
			getVariant() {
				return this.$store.getters['property-variant/getVariant'];
			},
			getPropertyErrors() {
				return this.$store.getters['property/getErrors'];
			},
			getTotal() {
				const total = this.$store.getters['basket/getTotal'];
				return {
					price: total.price,
					basePrice: total.basePrice,
					discount: this.$store.getters['basket/getDiscount'],
					currency: this.$store.getters['basket/getCurrency']
				};
			},
			getConsent() {
				return this.$store.getters['consent/get'];
			},
			getStage() {
				return this.$store.getters['application/getStage'];
			},
			getStatus() {
				return this.$store.getters['application/getStatus'];
			},
			getBasketConfig() {
				return {
					status: this.$store.getters['basket/getStatus']
				};
			},
			getPaySystem() {
				return this.$store.getters['pay-system/getPaySystem'];
			},
			getCheck() {
				return this.$store.getters['check/getCheck'];
			},
			getPayment() {
				return this.$store.getters['payment/getPayment'];
			},
			getPaymentConfig() {
				return {
					status: this.$store.getters['pay-system/getStatus'],
					returnUrl: this.$store.getters['application/getPathLocation'],
					mainPage: this.$store.getters['application/getPathMainPage']
				};
			},
			getSuccessfulConfig() {
				return {
					mainPage: this.$store.getters['application/getPathMainPage']
				};
			},
			getEmptyCartConfig() {
				return {
					path: this.$store.getters['application/getPath']
				};
			},
			getTitleCheckoutButton() {
				return {
					title: this.$store.getters['application/getTitleCheckoutButton']
				};
			},
			getErrors() {
				return this.$store.getters['application/getErrors'];
			}
		},
		watch: {
			getStage(stage) {
				const moveFocus = statusStages.has(stage) ? moveFocusToPlacedOrder : moveFocusToStage;
				this.$nextTick(() => moveFocus(this.$el.querySelector(stageContainer)));
			},
			checkoutButtonEnabled() {
				// the button is replaced by another component, and a focus left on the old node falls to the body
				const holdsFocus = this.$el.querySelector(checkoutButtonContainer)?.contains(document.activeElement);
				this.$nextTick(() => {
					if (holdsFocus) {
						this.$el.querySelector(`${checkoutButtonContainer} button`)?.focus();
					}
				});
			}
		},
		created() {
			this.unsubscribeOrderAnswer = this.$store.subscribe(mutation => {
				if (orderAnswerMutations.has(mutation.type)) {
					this.$nextTick(() => moveFocusToRejectedField(this.$el));
				}
			});
			main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.backdropTotalOpen, event => {
				this.totalIsShow = 'Y';
			});
			main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.backdropTotalClose, event => {
				this.totalIsShow = 'N';
			});
		},
		beforeDestroy() {
			this.unsubscribeOrderAnswer();
			main_core_events.EventEmitter.unsubscribe(sale_checkout_const.EventType.basket.backdropTotalOpen);
			main_core_events.EventEmitter.unsubscribe(sale_checkout_const.EventType.basket.backdropTotalClose);
		},
		// language=Vue
		template: `
			<div class="checkout-container-wrapper" data-testid="sale-checkout-form">
			<div class="checkout-basket-container" data-testid="sale-checkout-stage">
			<template v-if="getStage === stage.edit">
				<sale-checkout-view-product :items="getBasket" :total="getTotal" :mode="mode.edit" :errors="getBasketErrors" :config="getBasketConfig"/>
				<sale-checkout-view-property :items="getProperty" :mode="mode.edit" :errors="getPropertyErrors" :propertyVariants="getVariant"/>
				<sale-checkout-view-alert-list :errors="getErrors"/>
				<sale-checkout-view-user_consent :item="getConsent" v-if="needCheckConsent"/>
				<template v-if="checkoutButtonEnabled">
				<sale-checkout-view-element-button-checkout :title="getTitleCheckoutButton.title" :wait="getStatus === status.wait"/>
				</template>
				<template v-else>
				<sale-checkout-view-element-button-checkout_disabled :title="getTitleCheckoutButton.title"/>
				</template>
			</template>
			<template v-else-if="getStage === stage.success">
				<template v-if="hasPS">
				<sale-checkout-view-successful :items="getProperty" :order="getOrder" :config="getSuccessfulConfig"/>
				</template>
				<template v-else>
				<sale-checkout-view-successful-without-ps :items="getProperty" :order="getOrder" :config="getSuccessfulConfig"/>
				</template>
			</template>
			<template v-else-if="getStage === stage.payed">
							<sale-checkout-view-successful_ps_return :items="getProperty" :order="getOrder" :total="getTotal" :config="getSuccessfulConfig"/>
			</template>
			<template v-else-if="getStage === stage.view">
				<sale-checkout-view-product :items="getBasket" :total="getTotal" :mode="mode.view" :errors="getBasketErrors" :config="getBasketConfig"/>
				<sale-checkout-view-property :items="getProperty" :mode="mode.view" :order="getOrder" :propertyVariants="getVariant"/>
				<sale-checkout-view-product-summary :total="getTotal" :mode="mode.view"/>
							<sale-checkout-view-payment :order="getOrder" :payments="getPayment" :paySystems="getPaySystem" :check="getCheck" :config="getPaymentConfig"/>
			</template>
			<template v-else-if="getStage === stage.empty">
				<sale-checkout-view-empty_cart :config="getEmptyCartConfig"/>
			</template>
			</div>
			<template v-if="getStage === stage.view">
			<sale-checkout-view-total :total="getTotal" :showBackdrop="totalIsShow"/>
			</template>
			</div>
	`
	});

	class Application {
		constructor(options = {}) {
			this.wrapper = main_core.Tag.render`<div class=""></div>`;
			this.init().then(() => this.prepareParams({
				options
			})).then(() => {
				this.initStore().then(result => {
					this.setStore(result);
					this.initController().then(() => {});
					this.initTemplate().then(() => {});
				}).catch(error => Application.showError(error));
			});
		}

		/**
		 * @private
		 */
		init() {
			return Promise.resolve();
		}

		/**
		 * @private
		 */
		prepareParams(params) {
			this.options = params.options;
			return Promise.resolve();
		}

		/**
		 * @private
		 */
		initStore() {
			const builder = new ui_vue_vuex.VuexBuilder();
			let contextVariablesBasket = {
				product: this.options.product
			};
			let contextVariablesApp = {
				path: this.options.path,
				common: this.options.common,
				option: this.options.option,
				messages: this.options.messages
			};
			contextVariablesApp.path.location = sale_checkout_lib.Url.getCurrentUrl();
			return builder.addModel(sale_checkout_model.Order.create()).addModel(sale_checkout_model.Basket.create().setVariables(contextVariablesBasket)).addModel(sale_checkout_model.Property.create()).addModel(sale_checkout_model.Variant.create()).addModel(sale_checkout_model.Payment.create()).addModel(sale_checkout_model.Check.create()).addModel(sale_checkout_model.PaySystem.create()).addModel(sale_checkout_model.Application.create().setVariables(contextVariablesApp)).addModel(sale_checkout_model.Consent.create()).build();
		}

		/**
		 * @private
		 */
		layout() {
			return this.wrapper;
		}

		/**
		 * @private
		 */
		initController() {
			this.controller = new sale_checkout_controller.Application({
				store: this.store
			});
			return new Promise(resolve => resolve());
		}

		/**
		 * @private
		 */
		initTemplate() {
			return new Promise(resolve => {
				const context = this;
				this.templateEngine = ui_vue.BitrixVue.createApp({
					store: this.store,
					data: {
						options: this.options
					},
					beforeCreate() {
						this.$bitrix.Application.set(context);
					},
					created() {
						let data = {};
						if (context.options.basket.length > 0) {
							data = {
								order: this.options.order,
								basket: this.options.basket,
								paySystem: this.options.paySystem,
								payment: this.options.payment,
								check: this.options.check,
								total: this.options.total,
								currency: this.options.currency,
								discount: this.options.discount,
								property: this.options.property,
								variant: this.options.variant,
								consent: this.options.consent,
								consentStatus: this.options.consentStatus
							};
						}
						data.stage = this.options.stage;
						context.setModelData(data);
					},
					mounted() {
						resolve();
					},
					template: `<sale-checkout-form/>`
				}).mount(this.wrapper);
			});
		}

		/**
		 * @private
		 */
		setStore(data) {
			this.store = data.store;
		}

		/**
		 * @private
		 */
		setModelData(data) {
			//region: application model
			if (main_core.Type.isString(data.stage)) {
				this.store.dispatch('application/setStage', {
					stage: data.stage
				});
			}
			//endregion

			//region: order model
			if (main_core.Type.isObject(data.order)) {
				this.store.dispatch('order/set', data.order);
			}
			//endregion

			//region: basket model
			if (main_core.Type.isObject(data.basket)) {
				data.basket.forEach((fields, index) => {
					this.store.dispatch('basket/changeItem', {
						index,
						fields
					});
				});
			}
			if (main_core.Type.isString(data.currency)) {
				this.store.dispatch('basket/setCurrency', {
					currency: data.currency
				});
			}
			if (main_core.Type.isObject(data.discount)) {
				this.store.dispatch('basket/setDiscount', data.discount);
			}
			if (main_core.Type.isObject(data.total)) {
				this.store.dispatch('basket/setTotal', data.total);
			}
			//endregion

			//region: property model
			if (main_core.Type.isObject(data.property)) {
				data.property.forEach((fields, index) => {
					this.store.dispatch('property/changeItem', {
						index,
						fields
					});
				});
			}
			//endregion

			//region: variant model
			if (main_core.Type.isObject(data.variant)) {
				data.variant.forEach((fields, index) => {
					this.store.dispatch('property-variant/changeItem', {
						index,
						fields
					});
				});
			}
			//endregion

			//region: payment model
			if (main_core.Type.isObject(data.payment)) {
				data.payment.forEach((fields, index) => {
					this.store.dispatch('payment/changeItem', {
						index,
						fields
					});
				});
			}
			//endregion

			// region: check model
			if (main_core.Type.isObject(data.check)) {
				data.check.forEach((fields, index) => {
					this.store.dispatch('check/changeItem', {
						index,
						fields
					});
				});
			}
			//endregion

			// region: paySystem model
			if (main_core.Type.isObject(data.paySystem)) {
				data.paySystem.forEach((fields, index) => {
					this.store.dispatch('pay-system/changeItem', {
						index,
						fields
					});
				});
			}
			//endregion

			//region: consent
			if (main_core.Type.isString(data.consentStatus)) {
				this.store.dispatch('consent/setStatus', data.consentStatus);
			}
			if (main_core.Type.isObject(data.consent)) {
				this.store.dispatch('consent/set', data.consent);
			}
			//endregion

			// region: errors
			if (main_core.Type.isObject(data.errors)) {
				this.store.commit('basket/setErrors', data.errors);
			}
			//endregion
		}

		/**
		 * @private
		 */
		static showError(error) {
			console.error(error);
		}
	}

	exports.Application = Application;

})(this.BX.Sale.Checkout = this.BX.Sale.Checkout || {}, BX, BX.Sale.Checkout.Lib, BX, BX, BX.Sale.Checkout.Controller, BX.Sale.Checkout.Model, window, BX.Event, BX.UI.Accessibility, BX.Sale.Checkout.Const);
//# sourceMappingURL=application.bundle.js.map
