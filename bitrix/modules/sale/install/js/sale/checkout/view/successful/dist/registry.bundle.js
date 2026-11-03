/* eslint-disable */
(function (ui_vue, main_core, sale_checkout_view_element_button, sale_checkout_lib, currency_currencyCore, sale_checkout_const) {
	'use strict';

	ui_vue.BitrixVue.component('sale-checkout-view-successful-property_list', {
		props: ['items', 'order'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_SUCCESSFUL_'));
			},
			getNumber() {
				return main_core.Text.encode(this.order.accountNumber);
			},
			getTitle() {
				let message = this.localize.CHECKOUT_VIEW_SUCCESSFUL_STATUS_ORDER_TITLE;
				return message.replace('#ORDER_NUMBER#', this.getNumber);
			},
			getPropertiesShort() {
				const properties = [];
				for (let propertyId in this.items) {
					if (main_core.Type.isStringFilled(this.items[propertyId].value)) {
						properties.push(this.items[propertyId].value);
					}
				}
				return properties.join(', ');
			}
		},
		template: `
		<div class="checkout-order-info">
			<div>{{getTitle}}</div>
			<div>{{getPropertiesShort}}</div>
			<slot name="block-1"/>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-successful-call', {
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_SUCCESSFUL_CALL_'));
			}
		},
		// language=Vue
		template: `
		<div class="checkout-order-common-container">
			<div class="checkout-order-common-row">
				<svg class="checkout-order-common-row-icon" width="26" height="27" viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M12.9124 26.6569C20.0093 26.6569 25.7624 20.9038 25.7624 13.807C25.7624 6.71014 20.0093 0.957031 12.9124 0.957031C5.81561 0.957031 0.0625 6.71014 0.0625 13.807C0.0625 20.9038 5.81561 26.6569 12.9124 26.6569Z" fill="white"/>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M10.8218 19.498L5.72461 14.5304L7.50861 12.7918L10.8218 16.0207L18.3182 8.71484L20.1022 10.4535L10.8218 19.498Z" fill="#65A90F"/>
				</svg>
				<div>{{localize.CHECKOUT_VIEW_SUCCESSFUL_CALL_MANAGER}}</div>
			</div>
		</div>
`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-successful-without-ps', {
		props: ['items', 'order', 'config'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_SUCCESSFUL_'));
			},
			showReturnButton() {
				return this.$store.getters['application/getShowReturnButton'] === 'Y';
			}
		},
		// language=Vue
		template: `
		<div class="checkout-order-status-successful">
			<svg class="checkout-order-status-icon" aria-hidden="true" focusable="false" width="106" height="106" viewBox="0 0 106 106" fill="none" xmlns="http://www.w3.org/2000/svg">
						 	<circle class="checkout-order-status-icon-circle" stroke-width="3" cx="53" cy="53" r="51"/>
				<path class="checkout-order-status-icon-angle" fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="M45.517 72L28.5 55.4156L34.4559 49.611L45.517 60.3909L70.5441 36L76.5 41.8046L45.517 72Z"/>
			</svg>
			
						<h2 class="checkout-order-status-text" tabindex="-1">
							{{localize.CHECKOUT_VIEW_SUCCESSFUL_STATUS_ORDER_CREATED}}
						</h2>
			
			<sale-checkout-view-successful-property_list :items="items" :order="order"/>
			<sale-checkout-view-element-button-shipping-button :url="config.mainPage" v-if="showReturnButton">
				<template v-slot:button-title>{{localize.CHECKOUT_VIEW_SUCCESSFUL_ELEMENT_BUTTON_SHIPPING_TO_SHOP}}</template>
			</sale-checkout-view-element-button-shipping-button>
		</div>
`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-successful_ps_return', {
		props: ['items', 'order', 'total', 'config'],
		computed: {
			urlOrderDetail() {
				let path = sale_checkout_lib.Url.getCurrentUrl();
				return sale_checkout_lib.Url.addLinkParam(path, 'mode', 'detail');
			},
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_SUCCESSFUL_'));
			},
			priceFormatted() {
				return currency_currencyCore.CurrencyCore.currencyFormat(this.total.price, this.total.currency, true);
			},
			showReturnButton() {
				return this.$store.getters['application/getShowReturnButton'] === 'Y';
			}
		},
		// language=Vue
		template: `
			<div class="checkout-order-status-successful">
			<svg class="checkout-order-status-icon" aria-hidden="true" focusable="false" width="106" height="106" viewBox="0 0 106 106" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="checkout-order-status-icon-circle" stroke-width="3" cx="53" cy="53" r="51"/>
			<path class="checkout-order-status-icon-angle" fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="M45.517 72L28.5 55.4156L34.4559 49.611L45.517 60.3909L70.5441 36L76.5 41.8046L45.517 72Z"/>
			</svg>
	
			<h2 class="checkout-order-status-text" tabindex="-1">
				{{localize.CHECKOUT_VIEW_SUCCESSFUL_STATUS_ORDER_PAYED}}
			</h2>
	
			<sale-checkout-view-successful-property_list :items="items" :order="order">
			<template v-slot:block-1><div v-html="localize.CHECKOUT_VIEW_SUCCESSFUL_STATUS_ORDER_PAYED_1.replace('#AMOUNT#', priceFormatted)"/></template>
			</sale-checkout-view-successful-property_list>
					<sale-checkout-view-element-button-shipping-button :url="config.mainPage" v-if="showReturnButton">
						<template v-slot:button-title>{{localize.CHECKOUT_VIEW_SUCCESSFUL_ELEMENT_BUTTON_SHIPPING_TO_SHOP}}</template>
					</sale-checkout-view-element-button-shipping-button>
					<sale-checkout-view-element-button-shipping-link :url="urlOrderDetail">
						<template v-slot:link-title>{{localize.CHECKOUT_VIEW_SUCCESSFUL_ELEMENT_BUTTON_SHIPPING_TO_ORDER}}</template>
					</sale-checkout-view-element-button-shipping-link>
			</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-successful', {
		props: ['items', 'order', 'config'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_SUCCESSFUL_'));
			},
			getItemsForView() {
				const itemsForView = [];
				for (let propertyId in this.items) {
					const item = this.items[propertyId];
					if (BX.util.in_array(item.type, [sale_checkout_const.Property.type.name, sale_checkout_const.Property.type.phone, sale_checkout_const.Property.type.email])) {
						itemsForView.push(item);
					}
				}
				return itemsForView;
			}
		},
		// language=Vue
		template: `
			<div class="checkout-order-status-successful">
			<svg class="checkout-order-status-icon" aria-hidden="true" focusable="false" width="106" height="106" viewBox="0 0 106 106" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="checkout-order-status-icon-circle" stroke-width="3" cx="53" cy="53" r="51"/>
			<path class="checkout-order-status-icon-angle" fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="M45.517 72L28.5 55.4156L34.4559 49.611L45.517 60.3909L70.5441 36L76.5 41.8046L45.517 72Z"/>
			</svg>
	
			<h2 class="checkout-order-status-text" tabindex="-1">
				{{localize.CHECKOUT_VIEW_SUCCESSFUL_STATUS_ORDER_CREATED}}
			</h2>
	
			<sale-checkout-view-successful-property_list :items="getItemsForView" :order="order"/>
			<sale-checkout-view-element-button-shipping-button_to_checkout/>
			<sale-checkout-view-element-button-shipping-link :url="config.mainPage">
			<template v-slot:link-title>{{localize.CHECKOUT_VIEW_SUCCESSFUL_ELEMENT_BUTTON_SHIPPING_BUY}}</template>
			</sale-checkout-view-element-button-shipping-link>
			</div>
	`
	});

})(BX, BX, BX.Sale.Checkout.View.Element, BX.Sale.Checkout.Lib, BX.Currency, BX.Sale.Checkout.Const);
//# sourceMappingURL=registry.bundle.js.map
