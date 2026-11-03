/* eslint-disable */
(function (main_core, ui_vue, sale_paymentPay_lib, sale_paymentPay_const, sale_paymentPay_mixins_application, salescenter_paymentPay_userConsent, salescenter_paymentPay_backendProvider, sale_paymentPay_mixins_paymentSystem, main_core_events, sale_userConsentA11y) {
	'use strict';

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-application-pay_system', {
		props: {
			options: Object
		},
		mixins: [sale_paymentPay_mixins_application.MixinMethods],
		data() {
			const settings = new sale_paymentPay_lib.Settings(this.options);
			return {
				stageType: sale_paymentPay_const.StageType,
				stages: this.prepareParamsStages(),
				stage: this.setStageType(),
				loading: false,
				paymentProcess: this.prepareParamsPaymentProcess(settings),
				consent: this.prepareUserConsentSettings(settings),
				isNeedPaymentViewerViewAction: settings.get('isNeedPaymentViewerViewAction')
			};
		},
		created() {
			this.initPayment();
			this.initUserConsent();
			this.subscribeToGlobalEvents();
			if (this.isNeedPaymentViewerViewAction) {
				main_core.ajax.runComponentAction('bitrix:salescenter.payment.pay', 'paymentViewerView', {
					mode: 'class',
					data: {
						fields: this.paymentProcess.backendProvider.options
					}
				});
			}
		},
		methods: {
			initUserConsent() {
				this.userConsentManager = new salescenter_paymentPay_userConsent.UserConsent({
					eventName: this.consent.eventName,
					items: this.consent.items
				});
			},
			initBackendProvider() {
				this.backendProvider = new salescenter_paymentPay_backendProvider.BackendProvider({
					returnUrl: this.paymentProcess.returnUrl,
					orderId: this.paymentProcess.orderId,
					paymentId: this.paymentProcess.paymentId,
					accessCode: this.paymentProcess.accessCode
				});
			},
			startPayment(paySystemId) {
				if (this.loading) {
					return;
				}
				this.userConsentManager.askUserToPerform(() => {
					this.loading = true;
					this.stages.paySystemList.selectedPaySystem = paySystemId;
					this.backendProvider.paySystemId = paySystemId;
					this.paymentProcess.start();
				});
			},
			prepareParamsStages() {
				const settings = new sale_paymentPay_lib.Settings(this.options);
				return {
					paySystemList: {
						paySystems: settings.get('app.paySystems', []),
						selectedPaySystem: null,
						title: settings.get('app.title')
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
			},
			prepareUserConsentSettings(settings) {
				return {
					items: settings.get('consent.items'),
					title: settings.get('consent.title'),
					eventName: settings.get('consent.eventName'),
					containerId: settings.get('consent.containerId'),
					autoSave: settings.get('consent.autoSave'),
					originatorId: settings.get('consent.originatorId'),
					originId: settings.get('consent.originId')
				};
			}
		},
		// language=Vue
		template: `
		<div class="salescenter-payment-pay-app">
			<salescenter-payment_pay-components-payment_system-pay_system_list
				v-if="stage === stageType.list"
				:paySystems="stages.paySystemList.paySystems"
				:selectedPaySystem="stages.paySystemList.selectedPaySystem"
				:loading="loading"
				:title="stages.paySystemList.title"
				@start-payment="startPayment($event)">
				<template v-slot:user-consent>
					<salescenter-payment_pay-components-payment_system-user_consent
						:items="consent.items"
						:title="consent.title"
						:submitEventName="consent.eventName"
						:autoSave="consent.autoSave"
						:originatorId="consent.originatorId"
						:originId="consent.originId"/>
				</template>
			</salescenter-payment_pay-components-payment_system-pay_system_list>
			<salescenter-payment_pay-components-payment_system-error_box
				v-if="stage === stageType.errors"
				:errors="stages.paySystemErrors.errors">
				<salescenter-payment_pay-components-payment_system-reset_panel @reset="resetView()"/>
			</salescenter-payment_pay-components-payment_system-error_box>
			<salescenter-payment_pay-components-payment_system-pay_system_result
				v-if="stage === stageType.result"
				:html="stages.paySystemResult.html"
				:fields="stages.paySystemResult.fields">
				<salescenter-payment_pay-components-payment_system-reset_panel @reset="resetView()"/>
			</salescenter-payment_pay-components-payment_system-pay_system_result>
		</div>
	`
	});

	let descriptionSequence = 0;
	ui_vue.BitrixVue.component('salescenter-payment_pay-components-application-pay_system_info', {
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
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			},
			descriptionId() {
				return `salescenter-payment-pay-description-${this.descriptionSequenceNumber}`;
			},
			selectedName() {
				return this.selectedPaySystem ? this.selectedPaySystem.NAME : '';
			},
			selectedDescription() {
				return this.selectedPaySystem ? BX.util.htmlspecialchars(this.selectedPaySystem.DESCRIPTION) : '';
			}
		},
		created() {
			descriptionSequence++;
			this.descriptionSequenceNumber = descriptionSequence;
		},
		methods: {
			hasDescription(paySystem) {
				return String(paySystem.DESCRIPTION ?? '').trim() !== '';
			},
			isShown(paySystem) {
				return this.selectedPaySystem === paySystem;
			},
			// a method that has nothing to tell opens nothing, so it says nothing about being expanded
			expandedState(paySystem) {
				if (!this.hasDescription(paySystem)) {
					return null;
				}
				return this.isShown(paySystem) ? 'true' : 'false';
			},
			shownDescriptionId(paySystem) {
				return this.isShown(paySystem) ? this.descriptionId : null;
			},
			// the caption alone is the same on every row of the list, so the name of the method joins it
			infoButtonName(paySystem) {
				return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_INFO_BUTTON_NAME.replace('#PAY_SYSTEM#', () => paySystem.NAME);
			},
			showInfo(paySystem) {
				if (!this.hasDescription(paySystem)) {
					return;
				}
				this.selectedPaySystem = paySystem;
			},
			logoStyle(paySystem) {
				const defaultLogo = '/bitrix/js/salescenter/payment-pay/payment-method/images/default_logo.png';
				const src = paySystem.LOGOTIP || defaultLogo;
				return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
			}
		},
		// language=Vue
		template: `
		<div>
			<div class="order-payment-method-list" role="list" data-testid="salescenter-payment-system-info-list">
				<slot>
					<div class="order-pay-method-item-container info-mode" role="listitem" data-testid="salescenter-payment-system-info-row" v-for="paySystem in paySystems">
						<div class="order-pay-method-item-logo-block" aria-hidden="true">
							<div class="order-pay-method-logo" :style="logoStyle(paySystem)"></div>
						</div>
						<div class="order-pay-method-text-block">
							<div class="order-pay-method-text">{{ paySystem.NAME }}</div>
						</div>
						<button
							type="button"
							class="btn info-mode"
							data-testid="salescenter-payment-system-info-btn"
							:aria-label="infoButtonName(paySystem)"
							:aria-expanded="expandedState(paySystem)"
							:aria-controls="shownDescriptionId(paySystem)"
							@click="showInfo(paySystem)"
						>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_10 }}</button>
					</div>
				</slot>
			</div>
			<div class="order-payment-method-description" data-testid="salescenter-payment-system-info-description" v-if="selectedPaySystem" :id="descriptionId">
				<div class="order-payment-method-description-title">{{ selectedName }}</div>
				<div class="order-payment-method-description-text" v-html="selectedDescription"></div>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-application-payment', {
		props: {
			options: Object
		},
		mixins: [sale_paymentPay_mixins_application.MixinMethods],
		data() {
			const settings = new sale_paymentPay_lib.Settings(this.options);
			return {
				stageType: sale_paymentPay_const.StageType,
				stages: this.prepareParamsStages(),
				stage: this.setStageType(),
				loading: false,
				paymentProcess: this.prepareParamsPaymentProcess(settings),
				consent: this.prepareUserConsentSettings(settings)
			};
		},
		created() {
			this.initPayment();
			this.initUserConsent();
			this.subscribeToGlobalEvents();
		},
		methods: {
			initUserConsent() {
				this.userConsentManager = new salescenter_paymentPay_userConsent.UserConsent({
					eventName: this.consent.eventName,
					items: this.consent.items
				});
			},
			initBackendProvider() {
				this.backendProvider = new salescenter_paymentPay_backendProvider.BackendProvider({
					returnUrl: this.paymentProcess.returnUrl,
					orderId: this.paymentProcess.orderId,
					paymentId: this.paymentProcess.paymentId,
					accessCode: this.paymentProcess.accessCode
				});
			},
			startPayment(paySystemId) {
				if (this.loading) {
					return;
				}
				this.userConsentManager.askUserToPerform(() => {
					this.loading = true;
					this.backendProvider.paySystemId = paySystemId;
					this.paymentProcess.start();
				});
			},
			prepareParamsStages() {
				const settings = new sale_paymentPay_lib.Settings(this.options);
				return {
					paymentInfo: {
						paySystem: settings.get('app.paySystems', [])[0],
						title: settings.get('app.title'),
						sum: settings.get('payment.sumFormatted'),
						paid: settings.get('payment.paid'),
						checks: settings.get('payment.checks', [])
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
			},
			prepareUserConsentSettings(settings) {
				return {
					items: settings.get('consent.items'),
					eventName: settings.get('consent.eventName'),
					containerId: settings.get('consent.containerId'),
					autoSave: settings.get('consent.autoSave'),
					originatorId: settings.get('consent.originatorId'),
					originId: settings.get('consent.originId')
				};
			}
		},
		// language=Vue
		template: `
		<div class="salescenter-payment-pay-app">
			<salescenter-payment_pay-components-payment_system-payment_info
				v-if="stage === stageType.paymentInfo"
				:paySystem="stages.paymentInfo.paySystem"
				:title="stages.paymentInfo.title"
				:sum="stages.paymentInfo.sum"
				:paid="stages.paymentInfo.paid"
				:loading="loading"
				:checks="stages.paymentInfo.checks"
				@start-payment="startPayment($event)">
				<template v-slot:user-consent>
					<salescenter-payment_pay-components-payment_system-user_consent
						:items="consent.items"
						:title="consent.title"
						:submitEventName="consent.eventName"
						:autoSave="consent.autoSave"
						:originatorId="consent.originatorId"
						:originId="consent.originId"/>
				</template>
			</salescenter-payment_pay-components-payment_system-payment_info>
			<salescenter-payment_pay-components-payment_system-error_box
				v-if="stage === stageType.errors"
				:errors="stages.paySystemErrors.errors">
				<salescenter-payment_pay-components-payment_system-reset_panel @reset="resetView()"/>
			</salescenter-payment_pay-components-payment_system-error_box>
			<salescenter-payment_pay-components-payment_system-pay_system_result
				v-if="stage === stageType.result"
				:html="stages.paySystemResult.html"
				:fields="stages.paySystemResult.fields">
				<salescenter-payment_pay-components-payment_system-reset_panel @reset="resetView()"/>
			</salescenter-payment_pay-components-payment_system-pay_system_result>
		</div>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-payment_info-button', {
		props: {
			loading: {
				type: Boolean,
				default: false,
				required: false
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaymentInfoButton],
		computed: {
			classes() {
				const classes = ['landing-block-node-button', 'text-uppercase', 'btn', 'btn-xl', 'pr-7', 'pl-7', 'u-btn-primary', 'g-font-weight-700', 'g-font-size-12', 'g-rounded-50'];
				if (this.loading) {
					classes.push('loading');
				}
				return classes;
			}
		},
		// language=Vue
		template: `
		<button :class="classes" data-testid="salescenter-payment-info-btn" :aria-busy="ariaBusy" @click="onClick($event)">
			<slot></slot>
		</button>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-payment_info-pay_system_small_card', {
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

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-button', {
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
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinButton],
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
		// language=Vue
		template: `
		<button
			type="button"
			:class="classes"
			data-testid="salescenter-payment-pay-btn"
			:aria-label="accessibleName"
			:aria-busy="ariaBusy"
			@click="onClick($event)"
		>
			<span :class="buttonClasses"><slot></slot></span>
		</button>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-check', {
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
	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-error_box', {
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
				errorTextId: `salescenter-payment-error-text-${errorTextIdCounter}`
			};
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			}
		},
		// language=Vue
		template: `
		<div data-payment-stage="errors" data-testid="salescenter-payment-errors" tabindex="-1">
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

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-pay_system_list', {
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
			},
			title: {
				type: String,
				default: null,
				required: false
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaySystemList],
		// language=Vue
		template: `
		<div>
			<div class="page-section-title" v-if="title">{{ title }}</div>
			<div class="order-payment-method-list" role="list" data-testid="salescenter-payment-system-list">
				<slot>
					<salescenter-payment_pay-components-payment_system-pay_system_row 
						v-for="paySystem in paySystems"
						:loading="isItemLoading(paySystem.ID)"
						:name="paySystem.NAME"
						:logo="paySystem.LOGOTIP"
						:id="paySystem.ID"
						@click="startPayment($event)"
					/>
				</slot>
			</div>
						<slot name="user-consent"></slot>
		</div>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-pay_system_result', {
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
		<div data-payment-stage="result" data-testid="salescenter-payment-result" tabindex="-1">
			<template v-if="html">
				<div ref="paySystemResultTemplate"></div>
				<slot></slot>
			</template>
			<template v-else>
				<div class="checkout-basket-section">
					<div class="page-section-title">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_1 }}</div>
					<div class="checkout-basket-personal-order-info" v-if="fields">
						<div class="checkout-basket-personal-order-info-item" v-if="fields.SUM_WITH_CURRENCY">
							<span>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_2 }}</span> <strong v-html="fields.SUM_WITH_CURRENCY"></strong>
						</div>
						<div class="checkout-basket-personal-order-info-item" v-if="fields.PAY_SYSTEM_NAME">
							<span>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_3 }}</span> <strong>{{ fields.PAY_SYSTEM_NAME }}</strong>
						</div>
					</div>
				</div>
				<slot></slot>
			</template>
		</div>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-pay_system_row', {
		props: {
			loading: Boolean,
			name: String,
			logo: String,
			id: String | Number
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaySystemRow],
		// language=Vue
		template: `
		<div class="order-pay-method-item-container pay-mode" role="listitem" data-testid="salescenter-payment-system-row" @click="onClick()">
			<div class="order-pay-method-item-logo-block" aria-hidden="true">
				<div class="order-pay-method-logo" :style="logoStyle"></div>
			</div>
			<div class="order-pay-method-text-block">
				<div class="order-pay-method-text">{{ name }}</div>
			</div>
			<salescenter-payment_pay-components-payment_system-button :loading="loading" :paySystemName="name">
				{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_4 }}
			</salescenter-payment_pay-components-payment_system-button>
		</div>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-payment_info', {
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
				return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_11.replace('#SUM#', this.sum);
			}
		},
		mixins: [sale_paymentPay_mixins_paymentSystem.MixinPaymentInfo],
		// language=Vue
		template: `
		<div>
			<div class="order-payment-title" v-if="title">{{ title }}</div>
			<div class="order-payment-inner d-flex flex-wrap align-items-center justify-content-between">
				<salescenter-payment_pay-components-payment_system-payment_info-pay_system_small_card :name="paySystem.NAME" :logo="paySystem.LOGOTIP"/>
				<div class="order-payment-status d-flex align-items-center" v-if="paid">
					<div class="order-payment-status-ok"></div>
					<div>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_5 }}</div>
				</div>
				<div class="order-payment-price" v-html="totalSum"></div>
			</div>
			<hr v-if="checks.length > 0">
			<salescenter-payment_pay-components-payment_system-check 
				v-for="check in checks" 
				:title="check.title" 
				:link="check.link" 
				:status="check.status"/>
			<hr v-if="!paid">
			<slot name="user-consent" v-if="!paid"></slot>
			<div class="order-payment-buttons-container" v-if="!paid">
				<salescenter-payment_pay-components-payment_system-payment_info-button
					:loading="loading"
					@click="onClick()">
					{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_4 }}
				</salescenter-payment_pay-components-payment_system-payment_info-button>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-reset_panel', {
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
				<salescenter-payment_pay-components-payment_system-button
					:aria-describedby="paymentErrorTextId"
					@click="reset()"
				>
					{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_7 }}
				</salescenter-payment_pay-components-payment_system-button>
			</div>
		</div>	
	`
	});

	ui_vue.BitrixVue.component('salescenter-payment_pay-components-payment_system-user_consent', {
		props: {
			items: {
				type: Array,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			submitEventName: {
				type: String,
				required: true
			},
			autoSave: {
				type: Boolean,
				default: false,
				required: false
			},
			originatorId: {
				type: String,
				default: '',
				required: false
			},
			originId: {
				type: String,
				default: '',
				required: false
			}
		},
		mounted() {
			this.consentAccessibility = null;
			this.loadBlockHtml();
		},
		beforeDestroy() {
			this.consentAccessibility?.destroy();
			this.consentAccessibility = null;
		},
		methods: {
			loadBlockHtml() {
				if (this.items.length === 0) {
					return;
				}
				const data = {
					fields: {
						items: this.items,
						id: this.id,
						title: this.title,
						isChecked: this.checked ? 'Y' : 'N',
						submitEventName: this.submitEventName,
						autoSave: this.autoSave ? 'Y' : 'N',
						originatorId: this.originatorId,
						originId: this.originId
					}
				};
				main_core.ajax.runComponentAction('bitrix:salescenter.payment.pay', 'userConsentRequest', {
					mode: 'ajax',
					data
				}).then(response => {
					if (!main_core.Type.isPlainObject(response.data) || !main_core.Type.isStringFilled(response.data.html) || !BX.UserConsent) {
						return;
					}
					const html = response.data.html;
					const wrapper = this.$refs.consentDiv;
					wrapper.appendChild(main_core.Tag.render`<div>${html}</div>`);
					BX.UserConsent.loadAll(wrapper);
					this.consentAccessibility = sale_userConsentA11y.UserConsentPopupAccessibility.install();
					const controls = BX.UserConsent.getItems();
					controls.forEach(control => {
						main_core_events.EventEmitter.subscribe(control, BX.UserConsent.events.afterAccepted, event => {
							main_core_events.EventEmitter.emit(sale_paymentPay_const.EventType.consent.accepted, event);
						});
						main_core_events.EventEmitter.subscribe(control, BX.UserConsent.events.refused, event => {
							main_core_events.EventEmitter.emit(sale_paymentPay_const.EventType.consent.refused, event);
						});
					});
				});
			}
		},
		// language=Vue
		template: `
		<div class="salescenter-user-consent-list" data-testid="salescenter-payment-consent">
			<div ref="consentDiv"/>
		</div>
	`
	});

})(BX, BX, BX.Sale.PaymentPay.Lib, BX.Sale.PaymentPay.Const, BX.Sale.PaymentPay.Mixins.Application, BX.Salescenter.PaymentPay, BX.Salescenter.PaymentPay, BX.Sale.PaymentPay.Mixins.PaymentSystem, BX.Event, BX.Sale);
//# sourceMappingURL=registry.bundle.js.map
