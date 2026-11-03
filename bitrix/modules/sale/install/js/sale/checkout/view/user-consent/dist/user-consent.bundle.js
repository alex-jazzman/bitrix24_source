/* eslint-disable */
(function (ui_vue, main_core, main_core_events, sale_checkout_const, sale_userConsentA11y) {
	'use strict';

	ui_vue.BitrixVue.component('sale-checkout-view-user_consent', {
		props: ['item'],
		mounted() {
			this.consentAccessibility = null;
			this.getBlockHtml();
		},
		beforeDestroy() {
			this.consentAccessibility?.destroy();
			this.consentAccessibility = null;
		},
		methods: {
			getBlockHtml() {
				const userConsent = {
					title: this.item.title,
					isLoaded: this.item.isLoaded,
					autoSave: this.item.autoSave,
					submitEventName: this.item.submitEventName,
					fields: this.item.params,
					items: this.item.items
				};
				main_core.ajax.runComponentAction(sale_checkout_const.Component.bitrixSaleOrderCheckout, sale_checkout_const.RestMethod.saleEntityUserConsentRequest, {
					data: {
						fields: userConsent
					}
				}).then(response => {
					if (BX.type.isPlainObject(response.data) && BX.type.isNotEmptyString(response.data.html)) {
						const consent = response.data.html;
						if (BX.UserConsent !== undefined) {
							const wrapper = this.$refs.consentDiv;
							wrapper.appendChild(main_core.Tag.render`<div>${consent}</div>`);
							BX.UserConsent.loadAll(wrapper);
							this.consentAccessibility = sale_userConsentA11y.UserConsentPopupAccessibility.install();
							const controls = BX.UserConsent && BX.UserConsent.getItems();
							controls.forEach(control => {
								main_core_events.EventEmitter.subscribe(control, BX.UserConsent.events.afterAccepted, event => main_core_events.EventEmitter.emit(sale_checkout_const.EventType.consent.accepted, event));
								main_core_events.EventEmitter.subscribe(control, BX.UserConsent.events.refused, event => main_core_events.EventEmitter.emit(sale_checkout_const.EventType.consent.refused, event));
							});
						}
					}
				});
			}
		},
		// language=Vue
		template: `
		 <div class="checkout-basket-section checkout-basket-section-consent" data-testid="sale-checkout-consent">
		<div ref="consentDiv"/>
				</div>
	`
	});

})(BX, BX, BX.Event, BX.Sale.Checkout.Const, BX.Sale);
//# sourceMappingURL=user-consent.bundle.js.map
