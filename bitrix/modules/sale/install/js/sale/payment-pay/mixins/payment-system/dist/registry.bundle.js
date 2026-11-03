/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sale = this.BX.Sale || {};
this.BX.Sale.PaymentPay = this.BX.Sale.PaymentPay || {};
this.BX.Sale.PaymentPay.Mixins = this.BX.Sale.PaymentPay.Mixins || {};
(function (exports) {
	'use strict';

	var button$1 = {
		computed: {
			classes() {
				const classes = ['landing-block-node-button', 'text-uppercase', 'btn', 'btn-xl', 'pr-7', 'pl-7', 'u-btn-primary', 'g-font-weight-700', 'g-font-size-12', 'g-rounded-50'];
				if (this.loading) {
					classes.push('loading');
				}
				return classes;
			},
			// a string: Vue 2 drops an attribute bound to false
			ariaBusy() {
				return this.loading ? 'true' : 'false';
			}
		},
		methods: {
			onClick(event) {
				this.$emit('click', event);
			}
		}
	};

	var button = {
		computed: {
			classes() {
				return {
					'order-payment-method-item-button': true,
					'btn': true,
					'btn-primary': true,
					'rounded-pill': true,
					'pay-mode': true,
					'btn-wait': this.loading
				};
			},
			// a string: Vue 2 drops an attribute bound to false
			ariaBusy() {
				return this.loading ? 'true' : 'false';
			}
		},
		methods: {
			onClick(event) {
				this.$emit('click', event);
			}
		}
	};

	var check = {
		computed: {
			processing() {
				return this.status === 'P';
			},
			downloadable() {
				return this.status === 'Y' && this.link !== '';
			}
		}
	};

	var paySystemInfo = {
		props: {
			paySystems: {
				type: Array,
				default: [],
				required: false
			}
		},
		data() {
			return {
				selectedPaySystem: null
			};
		},
		computed: {
			selectedName() {
				return this.selectedPaySystem ? this.selectedPaySystem.NAME : '';
			},
			selectedDescription() {
				return this.selectedPaySystem ? BX.util.htmlspecialchars(this.selectedPaySystem.DESCRIPTION) : '';
			}
		},
		methods: {
			showInfo(paySystem) {
				this.selectedPaySystem = paySystem;
			},
			logoStyle(paySystem) {
				const defaultLogo = '/bitrix/js/salescenter/payment-pay/payment-method/images/default_logo.png';
				const src = paySystem.LOGOTIP || defaultLogo;
				return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
			}
		}
	};

	var paySystemList = {
		methods: {
			isItemLoading(paySystemId) {
				return this.selectedPaySystem === paySystemId && this.loading;
			},
			startPayment(paySystemId) {
				this.$emit('start-payment', paySystemId);
			}
		}
	};

	var paySystemRow = {
		methods: {
			onClick() {
				this.$emit('click', this.id);
			}
		},
		computed: {
			logoStyle() {
				const defaultLogo = '/bitrix/js/sale/payment-pay/images/default_logo.png';
				const src = this.logo || defaultLogo;
				return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
			}
		}
	};

	var paymentInfo = {
		methods: {
			onClick() {
				this.$emit('start-payment', this.paySystem.ID);
			},
			getCheckTitle(check) {
				let title = this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_11;
				return title.replace('#CHECK_ID#', check.id).replace('#DATE_CREATE#', check.dateFormatted);
			}
		}
	};

	var resetPanel = {
		methods: {
			reset() {
				this.$emit('reset');
			}
		}
	};

	exports.MixinButton = button;
	exports.MixinCheck = check;
	exports.MixinPaySystemInfo = paySystemInfo;
	exports.MixinPaySystemList = paySystemList;
	exports.MixinPaySystemRow = paySystemRow;
	exports.MixinPaymentInfo = paymentInfo;
	exports.MixinPaymentInfoButton = button$1;
	exports.MixinResetPanel = resetPanel;

})(this.BX.Sale.PaymentPay.Mixins.PaymentSystem = this.BX.Sale.PaymentPay.Mixins.PaymentSystem || {});
//# sourceMappingURL=registry.bundle.js.map
