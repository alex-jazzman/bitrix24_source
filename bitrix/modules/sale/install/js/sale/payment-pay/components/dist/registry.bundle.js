/* eslint-disable */
(function (ui_vue, sale_paymentPay_lib, sale_paymentPay_const, sale_paymentPay_mixins_application, sale_paymentPay_backendProvider, sale_paymentPay_mixins_paymentSystem, main_core_events, ui_a11y) {
	'use strict';

	ui_vue.BitrixVue.component('sale-payment_pay-components-application-pay_system', {
		props: {
			options: Object
		},
		mixins: [sale_paymentPay_mixins_application.MixinMethods],
		data() {
			let settings = new sale_paymentPay_lib.Settings(this.options);
			return {
				stageType: sale_paymentPay_const.StageType,
				stages: this.prepareParamsStages(),
				stage: this.setStageType(),
				loading: false,
				paymentProcess: this.prepareParamsPaymentProcess(settings)
			};
		},
		created() {
			this.initPayment();
			this.subscribeToGlobalEvents();
		},
		methods: {
			initBackendProvider() {
				this.backendProvider = new sale_paymentPay_backendProvider.BackendProvider({
					returnUrl: this.paymentProcess.returnUrl,
					orderId: this.paymentProcess.orderId,
					accessCode: this.paymentProcess.accessCode
				});
			},
			prepareParamsStages() {
				let settings = new sale_paymentPay_lib.Settings(this.options);
				return {
					paySystemList: {
						paySystems: settings.get('app.paySystems', []),
						selectedPaySystem: null
						// title: settings.get('app.title'),
					},
					paySystemErrors: {
						errors: []
					},
					paySystemResult: {
						html: null,
						fields: null
					}
				};
			},
			setStageType() {
				return sale_paymentPay_const.StageType.list;
			}
		},
		// language=Vue
		template: `
		<div class="salescenter-payment-pay-app">
			<template v-if="stage === stageType.list">
				<sale-payment_pay-components-payment_system-pay_system_list
					:paySystems="stages.paySystemList.paySystems"
					:selectedPaySystem="stages.paySystemList.selectedPaySystem"
					:loading="loading"
					@start-payment="startPayment($event)"/>
			</template>
			<template v-else>
				<!--region popup/backdrop -->
				<sale-payment_pay-components-payment_system-backdrop :paySystem="currentPS(stages.paySystemList.selectedPaySystem, stages.paySystemList.paySystems)">
					<template v-slot:main-content>
						<template v-if="stage === stageType.errors">
							<sale-payment_pay-components-payment_system-error_box :errors="stages.paySystemErrors.errors"/>
						</template>

						<template v-else-if="stage === stageType.result">
							<sale-payment_pay-components-payment_system-pay_system_result
								:html="stages.paySystemResult.html"
								:fields="stages.paySystemResult.fields">
									<template v-slot:default><sale-payment_pay-components-payment_system-reset_panel @reset="resetView()"/></template>
							</sale-payment_pay-components-payment_system-pay_system_result>
						</template>
					</template>
				</sale-payment_pay-components-payment_system-backdrop>
				<!--endregion-->
			</template>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-application-payment', {
		props: {
			options: Object
		},
		mixins: [sale_paymentPay_mixins_application.MixinMethods],
		data() {
			let settings = new sale_paymentPay_lib.Settings(this.options);
			return {
				stageType: sale_paymentPay_const.StageType,
				stages: this.prepareParamsStages(),
				stage: this.setStageType(),
				loading: false,
				paymentProcess: this.prepareParamsPaymentProcess(settings)
			};
		},
		created() {
			this.initPayment();
			this.subscribeToGlobalEvents();
		},
		methods: {
			initBackendProvider() {
				this.backendProvider = new sale_paymentPay_backendProvider.BackendProvider({
					returnUrl: this.paymentProcess.returnUrl,
					orderId: this.paymentProcess.orderId,
					accessCode: this.paymentProcess.accessCode
				});
			},
			prepareParamsStages() {
				let settings = new sale_paymentPay_lib.Settings(this.options);
				return {
					paymentInfo: {
						paySystem: settings.get('app.paySystems', [])[0],
						title: settings.get('app.title'),
						sum: settings.get('payment.sumFormatted'),
						paid: settings.get('payment.paid'),
						checks: settings.get('payment.checks', [])
					},
					paySystemList: {
						selectedPaySystem: null
					},
					paySystemErrors: {
						errors: []
					},
					paySystemResult: {
						html: null,
						fields: null
					}
				};
			},
			setStageType() {
				return sale_paymentPay_const.StageType.paymentInfo;
			}
		},
		// language=Vue
		template: `
		<div class="salescenter-payment-pay-app">
			<sale-payment_pay-components-payment_system-payment_info
								v-if="stage === stageType.paymentInfo"
				:paySystem="stages.paymentInfo.paySystem"
								:title="stages.paymentInfo.title"
				:sum="stages.paymentInfo.sum"
				:paid="stages.paymentInfo.paid"
				:loading="loading"
				:checks="stages.paymentInfo.checks"
								@start-payment="startPayment($event)">
			</sale-payment_pay-components-payment_system-payment_info>
						<sale-payment_pay-components-payment_system-error_box
								v-if="stage === stageType.errors"
								:errors="stages.paySystemErrors.errors">
							<sale-payment_pay-components-payment_system-reset_panel @reset="resetView()"/>
						</sale-payment_pay-components-payment_system-error_box>
						<sale-payment_pay-components-payment_system-pay_system_result
								v-if="stage === stageType.result"
								:html="stages.paySystemResult.html"
								:fields="stages.paySystemResult.fields">
							<sale-payment_pay-components-payment_system-reset_panel @reset="resetView()"/>
						</sale-payment_pay-components-payment_system-pay_system_result>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-payment_info-button', {
		props: {
			loading: {
				type: Boolean,
				default: false,
				required: false
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaymentInfoButton],
		// language=Vue
		template: `
		<button :class="classes" data-testid="sale-payment-info-btn" :aria-busy="ariaBusy" @click="onClick($event)">
			<slot></slot>
		</button>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-payment_info-pay_system_small_card', {
		props: {
			logo: String,
			name: String
		},
		template: `
		<div class="order-payment-operator">
			<img :src="logo" :alt="name" v-if="logo">
			<div class="order-payment-pay-system-name" v-else>{{ name }}</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-button', {
		props: {
			loading: {
				type: Boolean,
				default: false,
				required: false
			},
			paySystemName: {
				type: String,
				default: '',
				required: false
			}
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			},
			classes() {
				return {
					'order-payment-method-item-button': true,
					'btn': true,
					'btn-primary': true,
					'rounded-pill': true,
					'pay-mode': true,
					'order-payment-loader': this.loading
				};
			},
			buttonClasses() {
				return {
					'loading-button-text': this.loading
				};
			},
			// the caption repeats across the list, so the method name joins it; the reset panel has no method
			accessibleName() {
				if (this.paySystemName === '') {
					return null;
				}
				return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_PAY_BUTTON_NAME.replace('#PAY_SYSTEM#', () => this.paySystemName);
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinButton],
		// language=Vue
		template: `
		<button
			type="button"
			:class="classes"
			data-testid="sale-payment-pay-btn"
			:aria-label="accessibleName"
			:aria-busy="ariaBusy"
			@click="onClick($event)"
		>
			<span :class="buttonClasses"><slot></slot></span>
		</button>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-check', {
		props: {
			status: {
				type: String,
				default: '',
				required: false
			},
			link: {
				type: String,
				default: '',
				required: false
			},
			title: {
				type: String,
				required: true
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinCheck],
		// language=Vue
		template: `
		<div class="mb-2" :class="{'check-print': processing}">
			<a :href="link" target="_blank" class="check-link" v-if="downloadable">{{ title }}</a>
			<span v-else>{{ title }}</span>
		</div>
	`
	});

	let errorTextIdCounter = 0;
	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-error_box', {
		// the panel in the slot describes its button by the text of the plate
		provide() {
			return {
				paymentErrorTextId: this.errorTextId
			};
		},
		props: {
			errors: Array
		},
		data() {
			errorTextIdCounter++;
			return {
				errorTextId: `sale-payment-error-text-${errorTextIdCounter}`
			};
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			}
		},
		// language=Vue
		template: `
		<div data-payment-stage="errors" data-testid="sale-payment-errors" tabindex="-1">
			<div class="alert alert-danger" :id="errorTextId" data-payment-error-text>
				<slot name="errors-header">
					<div>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_8 }}</div>
				</slot>
				<slot name="errors-footer">
					<div>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_9 }}</div>
				</slot>
			</div>
			<slot></slot>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-pay_system_row', {
		props: {
			loading: Boolean,
			name: String,
			logo: String,
			id: Number
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaySystemRow],
		// language=Vue
		template: `
		<div class="order-pay-method-item-container pay-mode" role="listitem" data-testid="sale-payment-system-row" @click="onClick()">
			<div class="order-pay-method-item-logo-block" aria-hidden="true">
				<div class="order-pay-method-logo" :style="logoStyle"></div>
			</div>
			<div class="order-pay-method-text-block">
				<div class="order-pay-method-text">{{ name }}</div>
			</div>
			<sale-payment_pay-components-payment_system-button :loading="loading" :paySystemName="name">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_4 }}</sale-payment_pay-components-payment_system-button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-pay_system_list', {
		props: {
			paySystems: {
				type: Array,
				default: [],
				required: false
			},
			selectedPaySystem: {
				type: Number,
				default: null,
				required: false
			},
			loading: {
				type: Boolean,
				default: false,
				required: false
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaySystemList],
		// language=Vue
		template: `
		<div>
<!--			<div class="page-section-title" v-if="title">{{ title }}</div>-->
			<div class="order-payment-method-list" role="list" data-testid="sale-payment-system-list">
				<slot>
					<sale-payment_pay-components-payment_system-pay_system_row
						v-for="paySystem in paySystems"
						:loading="isItemLoading(paySystem.ID)"
						:name="paySystem.NAME"
						:logo="paySystem.LOGOTIP"
						:id="paySystem.ID"
						@click="startPayment($event)"
						:key="paySystem.ID"
					/>
				</slot>
			</div>
<!--            <slot name="user-consent"></slot>-->
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-pay_system_result', {
		props: {
			html: {
				type: String,
				default: null,
				required: false
			},
			fields: {
				type: Object,
				default: null,
				required: false
			}
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			}
		},
		mounted() {
			if (this.html) {
				BX.html(this.$refs.paySystemResultTemplate, this.html);
			}
		},
		// language=Vue
		template: `
		<div class="payment-mobile-change-method" data-payment-stage="result" data-testid="sale-payment-result" tabindex="-1">
			<template v-if="html">
				<div ref="paySystemResultTemplate"></div>
			</template>
			<template v-else>
				<div class="checkout-basket-section">
					<div class="page-section-title">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_1 }}</div>
					<div class="checkout-basket-personal-order-info" v-if="fields">
						<div class="checkout-basket-personal-order-info-item" v-if="fields.SUM_WITH_CURRENCY">
							<span>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_2 }}</span>
							<strong v-html="fields.SUM_WITH_CURRENCY"></strong>
						</div>
						<div class="checkout-basket-personal-order-info-item" v-if="fields.PAY_SYSTEM_NAME">
							<span>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_3 }}</span>
							<strong>{{ fields.PAY_SYSTEM_NAME }}</strong>
						</div>
					</div>
				</div>
			</template>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-payment_info', {
		props: {
			paySystem: Object,
			title: String,
			sum: String,
			loading: Boolean,
			paid: Boolean,
			checks: Array
		},
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_'));
			},
			totalSum() {
				return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_10.replace('#SUM#', this.sum);
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaymentInfo],
		// language=Vue
		template: `
		<div>
			<div class="order-payment-container">
				<div class="order-payment-title" v-if="title">{{ title }}</div>
				<div class="order-payment-inner d-flex align-items-center justify-content-between">
					<sale-payment_pay-components-payment_system-payment_info-pay_system_small_card :name="paySystem.NAME" :logo="paySystem.LOGOTIP"/>
					<div class="order-payment-status d-flex align-items-center" v-if="paid">
						<div class="order-payment-status-ok"></div>
						<div>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_5 }}</div>
					</div>
					<div class="order-payment-price" v-html="totalSum"></div>
				</div>
				<hr v-if="checks.length > 0">
				<sale-payment_pay-components-payment_system-check
					v-for="check in checks" :key="check.id"
					:title="getCheckTitle(check)"
					:link="check.link"
					:status="check.status"/>
				<div class="order-payment-buttons-container" v-if="!paid">
					<sale-payment_pay-components-payment_system-payment_info-button
						:loading="loading"
						@click="onClick()">
						{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_4 }}
					</sale-payment_pay-components-payment_system-payment_info-button>
				</div>	
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-reset_panel', {
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinResetPanel],
		// only the stage of errors provides it
		inject: {
			paymentErrorTextId: {
				default: null
			}
		},
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_'));
			}
		},
		// language=Vue
		template: `
		<div class="order-payment-buttons-container">
			<div class="order-basket-section-description py-3">
				{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_6 }}
			</div>
			<div class="order-basket-section-another-payment-button">
				<sale-payment_pay-components-payment_system-button
					:aria-describedby="paymentErrorTextId"
					@click="reset()"
				>
					{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_7 }}
				</sale-payment_pay-components-payment_system-button>
			</div>
		</div>	
	`
	});

	const stageSelector = '[data-payment-stage]';
	let stageIdCounter = 0;

	/**
	 * Focus trap of a payment layer, which is mounted open and removed on close; the host marks it `ref="dialog"`.
	 * `MixinMethods` returns the focus to the button the payment started from, so the trap does not restore it.
	 * The layer opens on its stage, so the reader starts with the outcome rather than with the close button.
	 * A stage that replaces another in the open layer describes it anew and takes the focus the removed one held.
	 */
	const MixinPaymentDialog = {
		props: ['paySystem'],
		data() {
			return {
				isShow: true
			};
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			},
			dialogName() {
				return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_DIALOG_NAME.replace('#PAY_SYSTEM#', () => this.paySystem.NAME);
			}
		},
		mounted() {
			this.describeByStage();
			this.focusTrap = new ui_a11y.FocusTrap(this.$refs.dialog, {
				isolateOutside: true,
				initialFocus: [stageSelector, true],
				restoreFocus: false
			});
			this.focusTrap.activate();
		},
		updated() {
			const stage = this.$refs.dialog.querySelector(stageSelector);
			if (stage === this.describedStage) {
				return;
			}
			this.describeByStage();
			stage?.focus();
		},
		beforeDestroy() {
			this.focusTrap?.destroy();
			this.focusTrap = null;
		},
		methods: {
			describeByStage() {
				const stage = this.$refs.dialog.querySelector(stageSelector);
				this.describedStage = stage;
				if (stage === null) {
					this.$refs.dialog.removeAttribute('aria-describedby');
					return;
				}
				stageIdCounter++;
				stage.id = stage.id || `sale-payment-stage-${stageIdCounter}`;
				this.$refs.dialog.setAttribute('aria-describedby', stage.id);
			},
			close() {
				this.isShow = false;
				main_core_events.EventEmitter.emit(sale_paymentPay_const.EventType.payment.reset, {});
			}
		}
	};

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-backdrop', {
		mixins: [MixinPaymentDialog],
		computed: {
			getObjectClass() {
				let result = ['checkout-basket-item'];
				if (this.isShow === true) {
					result.push('active-backdrop-open-change-sku active-popup-open');
				}
				return result;
			},
			title() {
				return BX.util.htmlspecialchars(this.paySystem.NAME);
			},
			logoStyle() {
				const defaultLogo = '/bitrix/js/sale/payment-pay/images/default_logo.png';
				const src = this.paySystem.LOGOTIP || defaultLogo;
				return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
			}
		},
		// language=Vue
		template: `
		<div :class=getObjectClass>
			<div
				class="checkout-basket-item-backdrop-wrapper js-backdrop-open-change-sku"
				data-testid="sale-payment-backdrop"
				role="dialog"
				aria-modal="true"
				:aria-label="dialogName"
				ref="dialog"
				@keydown.esc="close()"
			>
				<div class="checkout-basket-item-backdrop-overlay js-backdrop-open-change-sku"></div>
				<div class="checkout-basket-item-backdrop-container js-backdrop-open-change-sku">
					<div class="checkout-basket-item-detail-header justify-content-between align-items-center">
						<div id="bx_3966226736_424_7e1b8e3524755c391129a9d7e6f2d206_prebuy_swipe_btn"
							 class="checkout-basket-item-detail-swipe-btn-container">
							<div class="checkout-basket-item-detail-swipe-btn"></div>
						</div>
						<button type="button" class="checkout-order-payment-close" data-testid="sale-payment-backdrop-close-btn" @click="close()">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_12 }}</button>
					</div>
					<div class="checkout-basket-item-backdrop-inner">
						<div class="checkout-basket-item-backdrop-main">
							<div class="checkout-order-payment-title">
								<div class="checkout-basket-pay-method-item-logo-block" aria-hidden="true">
									<div
										:style=logoStyle
										class="checkout-basket-pay-method-logo"/>
								</div>
								<div class="checkout-order-payment-title-text">{{title}}</div>
							</div>
							<slot name="main-content"></slot>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-payment_pay-components-payment_system-popup', {
		mixins: [MixinPaymentDialog],
		computed: {
			getObjectClass() {
				let result = ['checkout-order-payment-popup-wrap'];
				if (this.isShow === true) {
					result.push('active-popup-open');
				}
				return result;
			},
			logoStyle() {
				const src = this.paySystem.LOGOTIP;
				return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
			}
		},
		// language=Vue
		template: `
	<div
		:class=getObjectClass
		data-testid="sale-payment-popup"
		role="dialog"
		aria-modal="true"
		:aria-label="dialogName"
		ref="dialog"
		@keydown.esc="close()"
	>
			<div class="checkout-order-payment-popup-overlay" data-testid="sale-payment-popup-overlay" @click="close()"/>
			<div class="checkout-order-payment-popup">
				<div class="checkout-order-payment-popup-head">
					<button type="button" class="checkout-order-payment-close" data-testid="sale-payment-popup-close-btn" @click="close()">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_12 }}</button>
				</div>
				<div class="checkout-order-payment-popup-main">
					<div class="checkout-order-payment-title">
						<div class="checkout-basket-pay-method-item-logo-block" aria-hidden="true">
							<div
								:style=logoStyle
								class="checkout-basket-pay-method-logo"/>
						</div>
					</div>
					<div class="checkout-order-payment-content">
						<slot name="main-content"></slot>
					</div>
					<div class="checkout-order-payment-btn-container">
						<button type="button" class="btn btn-primary rounded-pill" data-testid="sale-payment-popup-accept-btn" @click="close()">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_13 }}</button>
					</div>
				</div>
			</div>
	</div>`
	});

})(BX, BX.Sale.PaymentPay.Lib, BX.Sale.PaymentPay.Const, BX.Sale.PaymentPay.Mixins.Application, BX.Sale.PaymentPay.BackendProvider, BX.Sale.PaymentPay.Mixins.PaymentSystem, BX.Event, BX.UI.Accessibility);
//# sourceMappingURL=registry.bundle.js.map
