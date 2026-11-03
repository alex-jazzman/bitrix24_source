/* eslint-disable */
(function (ui_vue, main_core_events, sale_checkout_const, sale_checkout_view_mixins) {
	'use strict';

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-backdrop_close', {
		props: ['index'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ITEM_BACKDROP_'));
			}
		},
		methods: {
			click() {
				document.body.style.overflowY = '';
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropClose, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
		<div class="checkout-basket-item-detail-close-btn-container">
			<button
				class="checkout-basket-item-detail-close-btn"
				type="button"
				data-testid="sale-checkout-item-menu-close-btn"
				id="bx_3966226736_424_7e1b8e3524755c391129a9d7e6f2d206_prebuy_close_btn"
				@click="click"
			>
				<span class="checkout-basket-item-detail-close-btn-text">{{localize.CHECKOUT_VIEW_ITEM_BACKDROP_CLOSE}}</span>
			</button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-backdrop_overlay_close', {
		props: ['index'],
		methods: {
			click() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropClose, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
			<div class="checkout-basket-item-backdrop-overlay" data-testid="sale-checkout-backdrop-overlay" @click="click"/>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-backdrop_remove_cancel', {
		props: ['index'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ITEM_BACKDROP_'));
			}
		},
		methods: {
			click() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropClose, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
			<div class="checkout-basket-item-cancel-btn-container">
				<button class="product-item-detail-cancel-button btn border border-dark rounded-pill" @click="click">{{localize.CHECKOUT_VIEW_ITEM_BACKDROP_CANCEL}}</button>
			</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-backdrop_remove_remove', {
		props: ['index'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ITEM_BACKDROP_'));
			}
		},
		methods: {
			click() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.buttonRemoveProduct, {
					index: this.index
				});
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropClose, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
			<div class="checkout-basket-item-remove-btn-container pt-2">
				<button class="product-item-detail-remove-button btn btn-danger rounded-pill" @click="click">{{localize.CHECKOUT_VIEW_ITEM_BACKDROP_REMOVE}}</button>
			</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-backdrop_sku_change', {
		props: ['index'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ITEM_BACKDROP_'));
			}
		},
		methods: {
			click() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropClose, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
			<div class="checkout-basket-item-change-confirm-btn-container">
				<button class="product-item-detail-buy-button btn btn-primary rounded-pill" data-testid="sale-checkout-variation-save-btn" @click="click">{{localize.CHECKOUT_VIEW_ITEM_BACKDROP_SAVE}}</button>
			</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-shipping-button', {
		props: ['url'],
		mixins: [sale_checkout_view_mixins.MixinButtonWait],
		methods: {
			clickAction() {
				this.setWait();
				document.location.href = this.url;
			}
		},
		// language=Vue
		template: `
		<div class="checkout-order-status-btn-container">
			<button :class="getObjectClass" :aria-busy="ariaBusy" type="button" data-testid="sale-checkout-shipping-btn" @click="clickAction">
				<slot name="button-title"/>
			</button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-shipping-button_to_checkout', {
		mixins: [sale_checkout_view_mixins.MixinButtonWait],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_SHIPPING_'));
			}
		},
		methods: {
			clickAction() {
				this.setWait();
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.element.buttonShipping);
			}
		},
		// language=Vue
		template: `
		<div class="checkout-order-status-btn-container">
			<button :class="getObjectClass" :aria-busy="ariaBusy" type="button" data-testid="sale-checkout-shipping-now-btn" @click="clickAction">{{localize.CHECKOUT_VIEW_ELEMENT_BUTTON_SHIPPING_NAME_NOW}}</button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-checkout', {
		props: ['title', 'wait'],
		methods: {
			checkout() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.element.buttonCheckout);
			}
		},
		computed: {
			// a string: Vue 2 drops an attribute bound to false
			ariaBusy() {
				return this.wait ? 'true' : 'false';
			},
			getObjectClass() {
				const classes = ['btn', 'btn-primary', 'product-item-buy-button', 'rounded-pill'];
				if (this.wait) {
					classes.push('btn-wait');
				}
				return classes;
			}
		},
		// language=Vue
		template: `
		<div class="checkout-btn-container">
			<button :class="getObjectClass" :aria-busy="ariaBusy" type="button" data-testid="sale-checkout-submit-btn" @click="checkout">{{title}}</button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-checkout_disabled', {
		props: ['title'],
		computed: {
			getObjectClass() {
				const classes = ['btn', 'btn-primary', 'product-item-detail-buy-button', 'btn-lg', 'rounded-pill'];
				return classes;
			}
		},
		// language=Vue
		template: `
		<div class="checkout-btn-container">
			<button :disabled="true" :class="getObjectClass" >{{title}}</button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-item_change_sku', {
		props: ['index'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ITEM_BACKDROP_'));
			}
		},
		methods: {
			backdropOpen() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropOpenChangeSku, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
		<div class="checkout-basket-mobile-only">
			<button
				class="checkout-basket-item-change-btn"
				type="button"
				data-testid="sale-checkout-change-variation-btn"
				@click="backdropOpen"
			>{{localize.CHECKOUT_VIEW_ITEM_BACKDROP_ITEM_EDIT_CHANGE}}</button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-item_mobile_menu', {
		props: ['index'],
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_ITEM_MOBILE_MENU_');
			}
		},
		methods: {
			backdropOpen() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropOpenMobileMenu, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
		<button
			class="checkout-basket-item-remove-dots-btn checkout-basket-mobile-only"
			type="button"
			data-testid="sale-checkout-item-menu-btn"
			:aria-label="localize.CHECKOUT_VIEW_ELEMENT_BUTTON_ITEM_MOBILE_MENU_NAME"
			@click="backdropOpen"
		/>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-shipping-link', {
		props: ['url'],
		// language=Vue
		template: `
		<a class="btn btn-checkout-order-status-link" :href="url" data-testid="sale-checkout-shipping-link">
			<slot name="link-title"/>
		</a>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-minus', {
		props: ['index', 'disabled'],
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_MINUS_');
			}
		},
		methods: {
			minus() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.buttonMinusProduct, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
		<button
			class="checkout-item-quantity-btn-minus no-select"
			type="button"
			:aria-label="localize.CHECKOUT_VIEW_ELEMENT_BUTTON_MINUS_NAME"
			:aria-disabled="disabled"
			@click="minus"
		/>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-plus', {
		props: ['index', 'disabled'],
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_PLUS_');
			}
		},
		methods: {
			plus() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.buttonPlusProduct, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
		<button
			class="checkout-item-quantity-btn-plus no-select"
			type="button"
			:aria-label="localize.CHECKOUT_VIEW_ELEMENT_BUTTON_PLUS_NAME"
			:aria-disabled="disabled"
			@click="plus"
		/>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-remove', {
		props: ['index'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_REMOVE_'));
			}
		},
		methods: {
			remove() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.buttonRemoveProduct, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
		<button
			class="checkout-basket-item-remove-btn checkout-basket-desktop-only"
			type="button"
			data-testid="sale-checkout-remove-btn"
			@click="remove"
		>{{localize.CHECKOUT_VIEW_ELEMENT_BUTTON_REMOVE_NAME}}</button>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-button-restore', {
		props: ['index', 'describedBy'],
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_RESTORE_'));
			}
		},
		methods: {
			restore() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.buttonRestoreProduct, {
					index: this.index
				});
			}
		},
		// language=Vue
		template: `
		<button
			class="checkout-resotre-btn btn btn-sm border rounded-pill"
			type="button"
			:aria-describedby="describedBy"
			data-testid="sale-checkout-restore-btn"
			@click="restore"
		>{{localize.CHECKOUT_VIEW_ELEMENT_BUTTON_RESTORE_NAME}}</button>
	`
	});

})(BX, BX.Event, BX.Sale.Checkout.Const, BX.Sale.Checkout.View.Mixins);
//# sourceMappingURL=registry.bundle.js.map
