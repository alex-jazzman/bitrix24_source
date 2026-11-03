import {BitrixVue} from 'ui.vue';

let descriptionSequence = 0;

BitrixVue.component('salescenter-payment_pay-components-application-pay_system_info', {
	props: {
		paySystems: {
			type: Array,
			default: [],
			required: false,
		},
	},
	data()
	{
		return {
			selectedPaySystem: null,
		};
	},
	computed: {
		localize()
		{
			return BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
		},
		descriptionId()
		{
			return `salescenter-payment-pay-description-${this.descriptionSequenceNumber}`;
		},
		selectedName()
		{
			return this.selectedPaySystem ? this.selectedPaySystem.NAME : '';
		},
		selectedDescription()
		{
			return this.selectedPaySystem ? BX.util.htmlspecialchars(this.selectedPaySystem.DESCRIPTION) : '';
		}
	},
	created()
	{
		descriptionSequence++;
		this.descriptionSequenceNumber = descriptionSequence;
	},
	methods: {
		hasDescription(paySystem)
		{
			return String(paySystem.DESCRIPTION ?? '').trim() !== '';
		},
		isShown(paySystem)
		{
			return this.selectedPaySystem === paySystem;
		},
		// a method that has nothing to tell opens nothing, so it says nothing about being expanded
		expandedState(paySystem)
		{
			if (!this.hasDescription(paySystem))
			{
				return null;
			}

			return this.isShown(paySystem) ? 'true' : 'false';
		},
		shownDescriptionId(paySystem)
		{
			return this.isShown(paySystem) ? this.descriptionId : null;
		},
		// the caption alone is the same on every row of the list, so the name of the method joins it
		infoButtonName(paySystem)
		{
			return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_INFO_BUTTON_NAME
				.replace('#PAY_SYSTEM#', () => paySystem.NAME)
			;
		},
		showInfo(paySystem)
		{
			if (!this.hasDescription(paySystem))
			{
				return;
			}

			this.selectedPaySystem = paySystem;
		},
		logoStyle(paySystem)
		{
			const defaultLogo = '/bitrix/js/salescenter/payment-pay/payment-method/images/default_logo.png';
			const src = paySystem.LOGOTIP || defaultLogo;

			return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
		},
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
	`,
});
