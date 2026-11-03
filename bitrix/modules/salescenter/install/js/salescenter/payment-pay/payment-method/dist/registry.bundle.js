/* eslint-disable */
(function (ui_vue) {
	'use strict';

	let listSequence = 0;
	ui_vue.Vue.component('salescenter-payment_pay-payment_method-list', {
		props: ['items'],
		data() {
			return {
				list: []
			};
		},
		computed: {
			localize() {
				return ui_vue.Vue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_METHOD_');
			}
		},
		created() {
			listSequence++;
			this.listSequenceNumber = listSequence;
		},
		methods: {
			showDescription(item) {
				if (!this.hasDescription(item)) {
					return;
				}
				item.SHOW_DESCRIPTION = item.SHOW_DESCRIPTION === 'Y' ? 'N' : 'Y';
			},
			hasDescription(item) {
				return String(item.DESCRIPTION ?? '').trim() !== '';
			},
			isShow(item) {
				return this.hasDescription(item) && item.SHOW_DESCRIPTION === 'Y';
			},
			descriptionId(index) {
				return `salescenter-payment-pay-method-description-${this.listSequenceNumber}-${index}`;
			},
			// a method that has nothing to tell opens nothing, so it says nothing about being expanded
			expandedState(item) {
				if (!this.hasDescription(item)) {
					return null;
				}
				return this.isShow(item) ? 'true' : 'false';
			},
			shownDescriptionId(item, index) {
				return this.isShow(item) ? this.descriptionId(index) : null;
			},
			// the caption alone is the same on every row of the list, so the name of the method joins it
			infoButtonName(item) {
				return this.localize.PAYMENT_PAY_PAYMENT_METHOD_INFO_BUTTON_NAME.replace('#PAY_SYSTEM#', () => item.NAME);
			},
			beforeEnter: function (element) {
				element.style.opacity = 0;
				element.style.maxHeight = 0;
			},
			/**
			 * The opening frame has to be painted first, or the browser merges both values and skips the transition.
			 */
			enter: function (element) {
				setTimeout(function () {
					element.style.opacity = 1;
					element.style.maxHeight = element.scrollHeight + 'px';
				});
			},
			afterEnter: function (element) {
				element.style.opacity = "";
				element.style.maxHeight = "";
			},
			beforeLeave: function (element) {
				element.style.opacity = 1;
				element.style.maxHeight = element.scrollHeight + 'px';
			},
			leave: function (element) {
				setTimeout(function () {
					element.style.opacity = 0;
					element.style.maxHeight = 0;
				});
			},
			getLogoSrc(item) {
				return item.LOGOTIP ? item.LOGOTIP : '/bitrix/js/salescenter/payment-pay/payment-method/images/default_logo.png';
			}
		},
		// language=Vue
		template: `
		<div class="checkout-basket-section" data-testid="salescenter-payment-method-block">
			<h2 class="landing-block-node-title h2 text-left g-mb-15 g-font-weight-500 g-font-size-20">{{localize.PAYMENT_PAY_PAYMENT_METHOD_1}}</h2>
			<div class="checkout-basket-pay-method-list" role="list" data-testid="salescenter-payment-method-list">
				<div class="checkout-basket-pay-method-item-container" role="listitem" data-testid="salescenter-payment-method-row" v-for="(item, index) in items">
					<div class="checkout-basket-pay-method-item-logo-block" aria-hidden="true">
						<div class="checkout-basket-pay-method-logo" :style="'background-image: url(\\'' + getLogoSrc(item) + '\\')'"></div>
					</div>
					<div class="checkout-basket-pay-method-text-block">
						<div class="checkout-basket-pay-method-text">{{item.NAME}}</div>
					</div>
					<div class="checkout-basket-pay-method-btn-block">
						<button
							type="button"
							class="checkout-checkout-btn-info border btn btn-sm rounded-pill"
							data-testid="salescenter-payment-method-info-btn"
							:aria-label="infoButtonName(item)"
							:aria-expanded="expandedState(item)"
							:aria-controls="shownDescriptionId(item, index)"
							@click='showDescription(item)'
						>{{localize.PAYMENT_PAY_PAYMENT_METHOD_2}}</button>
					</div>
										<transition
						name="fade"
												:duration="300"
												v-on:before-enter="beforeEnter"
												v-on:enter="enter"
												v-on:after-enter="afterEnter"
												v-on:before-leave="beforeLeave"
												v-on:leave="leave"
					>
						<div class="checkout-basket-pay-method-description" data-testid="salescenter-payment-method-description" v-if="isShow(item)" :id="descriptionId(index)">{{item.DESCRIPTION}}</div>
						</transition>
				</div>
			</div>
		</div>
	`
	});

})(BX);
//# sourceMappingURL=registry.bundle.js.map
