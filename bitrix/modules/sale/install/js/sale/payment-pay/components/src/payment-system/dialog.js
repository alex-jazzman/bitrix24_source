import { BitrixVue } from 'ui.vue';
import { EventType } from 'sale.payment-pay.const';
import { EventEmitter } from 'main.core.events';
import { FocusTrap } from 'ui.a11y';

import './dialog.css';

const stageSelector = '[data-payment-stage]';
let stageIdCounter = 0;

/**
 * Focus trap of a payment layer, which is mounted open and removed on close; the host marks it `ref="dialog"`.
 * `MixinMethods` returns the focus to the button the payment started from, so the trap does not restore it.
 * The layer opens on its stage, so the reader starts with the outcome rather than with the close button.
 * A stage that replaces another in the open layer describes it anew and takes the focus the removed one held.
 */
export const MixinPaymentDialog = {
	props: ['paySystem'],
	data()
	{
		return {
			isShow: true,
		};
	},
	computed:
	{
		localize()
		{
			return BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
		},
		dialogName()
		{
			return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_DIALOG_NAME
				.replace('#PAY_SYSTEM#', () => this.paySystem.NAME)
			;
		},
	},
	mounted()
	{
		this.describeByStage();

		this.focusTrap = new FocusTrap(this.$refs.dialog, {
			isolateOutside: true,
			initialFocus: [stageSelector, true],
			restoreFocus: false,
		});
		this.focusTrap.activate();
	},
	updated()
	{
		const stage = this.$refs.dialog.querySelector(stageSelector);

		if (stage === this.describedStage)
		{
			return;
		}

		this.describeByStage();
		stage?.focus();
	},
	beforeDestroy()
	{
		this.focusTrap?.destroy();
		this.focusTrap = null;
	},
	methods:
	{
		describeByStage()
		{
			const stage = this.$refs.dialog.querySelector(stageSelector);
			this.describedStage = stage;

			if (stage === null)
			{
				this.$refs.dialog.removeAttribute('aria-describedby');

				return;
			}

			stageIdCounter++;
			stage.id = stage.id || `sale-payment-stage-${stageIdCounter}`;
			this.$refs.dialog.setAttribute('aria-describedby', stage.id);
		},
		close()
		{
			this.isShow = false;
			EventEmitter.emit(EventType.payment.reset, {});
		},
	},
};
