import { EventType } from 'sale.payment-pay.const';
import { EventEmitter } from 'main.core.events';
import { Loc, Type } from 'main.core';
import { FocusMonitor, FocusNavigator, LiveAnnouncer } from 'ui.a11y';
import { VirtualForm, PaymentProcess } from 'sale.payment-pay.lib';
import { StageType } from 'sale.payment-pay.const';

// only the final stage is marked: from the list and the details the focus returns to the pay button
const stageSelector = '[data-payment-stage]';

// a modal layer focuses the stage itself; a stage without a layer gets the focus here
const modalLayerSelector = '[role="dialog"][aria-modal="true"]';

const errorTextSelector = '[data-payment-error-text]';

// the length LiveAnnouncer cuts a message at
const maxMessageLength = 160;

const stageMessageId = {
	[StageType.errors]: 'PAYMENT_PAY_MIXINS_APPLICATION_ANNOUNCE_STAGE_ERRORS',
	[StageType.result]: 'PAYMENT_PAY_MIXINS_APPLICATION_ANNOUNCE_STAGE_RESULT',
};

export default {
	methods:
	{
		//region payment-process
		prepareParamsPaymentInfo(settings)
		{
			return {
				paySystem: settings.get('app.paySystems', [])[0],
				title: settings.get('app.title'),
				sum: settings.get('payment.sumFormatted'),
				paid: settings.get('payment.paid'),
				checks: settings.get('payment.checks', []),
			}
		},
		prepareParamsPaymentProcess(settings)
		{
			return {
				returnUrl: settings.get('paymentProcess.returnUrl'),
				orderId: settings.get('paymentProcess.orderId'),
				paymentId: settings.get('paymentProcess.paymentId'),
				accessCode: settings.get('paymentProcess.accessCode'),
				allowPaymentRedirect: settings.get('paymentProcess.allowPaymentRedirect'),
			}
		},
		startPayment(paySystemId)
		{
			if (this.loading)
			{
				return false;
			}

			this.loading = true;
			this.stages.paySystemList.selectedPaySystem = paySystemId;
			this.backendProvider.paySystemId = paySystemId;
			this.paymentProcess.start();
		},
		initPayment()
		{
			this.initBackendProvider();
			this.initPaymentProcess();
		},
		initBackendProvider()
		{
			throw new Error("Method 'initBackendProvider' must be overloaded");
		},
		initPaymentProcess()
		{
			this.paymentProcess = new PaymentProcess({
				backendProvider: this.backendProvider,
				allowPaymentRedirect: this.paymentProcess.allowPaymentRedirect,
			});
		},
		//endregion

		//region pay-system
		subscribeToGlobalEvents()
		{
			EventEmitter.subscribe(EventType.payment.reset, (e) => { this.resetView(this.props) });
			EventEmitter.subscribe(EventType.payment.error, (e) => { this.handlePaymentError(e.getData()) });
			EventEmitter.subscribe(EventType.payment.success, (e) => { this.handlePaymentSuccess(e.getData()) });
			EventEmitter.subscribe(EventType.global.paySystemAjaxError, (e) => { this.handlePaySystemAjaxError(e.getData()) });
			EventEmitter.subscribe(EventType.global.paySystemUpdateTemplate, (e) => { this.handlePaySystemUpdateTemplate(e.getData()) });
		},
		handlePaymentError(response)
		{
			this.stages.paySystemErrors.errors = response.errors || [];
			this.showStage(StageType.errors);
		},
		handlePaymentSuccess(response)
		{
			this.stages.paySystemResult.html = response.data.html || null;
			this.stages.paySystemResult.fields = response.data.fields || null;
			this.showStage(StageType.result);
		},
		handlePaySystemAjaxError(data)
		{
			this.stages.paySystemErrors.errors = data || [];
			this.showStage(StageType.errors);
		},
		handlePaySystemUpdateTemplate(data)
		{
			VirtualForm.createFromNode(this.$el).submit();
		},
		resetView(props)
		{
			const startedWith = this.stages.paySystemList ? this.stages.paySystemList.selectedPaySystem : null;

			this.stages = this.prepareParamsStages(props);
			this.stage = this.setStageType(props);
			this.loading = false;

			this.returnFocusToPaymentStart(startedWith);
		},
		/**
		 * The only place stages switch: `v-if` drops the old stage, so the new one is announced and focused here.
		 */
		showStage(stage)
		{
			if (this.stage === stage)
			{
				return;
			}

			this.stage = stage;
			this.announceStage(stage);
			this.moveFocusToStage();
		},
		/**
		 * Said once the stage is drawn: a modal layer is described by its stage and focuses it, so it says nothing.
		 */
		announceStage(stage)
		{
			const message = Loc.getMessage(stageMessageId[stage]);

			if (!Type.isStringFilled(message))
			{
				return;
			}

			this.$nextTick(() => {
				if (this.stage !== stage || this.isStageInModalLayer())
				{
					return;
				}

				// said politely, the text of the plate follows the name of the focus
				const text = stage === StageType.errors ? this.composeErrorMessage(message) : message;
				LiveAnnouncer.announce(text, 'polite');
			});
		},
		isStageInModalLayer()
		{
			const stageNode = this.$el.querySelector(stageSelector);

			return stageNode !== null && stageNode.closest(modalLayerSelector) !== null;
		},
		composeErrorMessage(stageMessage)
		{
			const textNode = this.$el.querySelector(`${stageSelector} ${errorTextSelector}`);
			const text = textNode === null ? '' : this.collectText(textNode);
			const message = text === '' ? stageMessage : `${stageMessage}. ${text}`;

			if (message.length <= maxMessageLength)
			{
				return message;
			}

			const truncated = message.slice(0, maxMessageLength - 1);

			return `${truncated.replace(/\s+\S*$/, '') || truncated}\u2026`;
		},
		/**
		 * The lines of the plate are separate blocks with no space between them in the markup.
		 */
		collectText(node)
		{
			const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
			const parts = [];

			while (walker.nextNode())
			{
				const part = walker.currentNode.textContent.replaceAll(/\s+/g, ' ').trim();

				if (part !== '')
				{
					parts.push(part);
				}
			}

			return parts.join(' ');
		},
		moveFocusToStage()
		{
			this.$nextTick(() => {
				const stageNode = this.$el.querySelector(stageSelector);

				if (stageNode === null || this.isStageInModalLayer())
				{
					return;
				}

				// a container focused by script shows no ring, so the keyboard lands on a stop it can see
				if (
					FocusMonitor.Instance.getLastInputModality() === 'keyboard'
					&& FocusNavigator.focusFirst(stageNode, { tabbableOnly: true })
				)
				{
					return;
				}

				stageNode.focus();
			});
		},
		/**
		 * The list is rebuilt, so the start button is found again by its method; the details screen has one button.
		 */
		returnFocusToPaymentStart(paySystemId)
		{
			this.$nextTick(() => {
				const button = this.findPaymentStartButton(paySystemId);

				if (button !== null)
				{
					button.focus();

					return;
				}

				FocusNavigator.focusFirst(this.$el);
			});
		},
		findPaymentStartButton(paySystemId)
		{
			const paySystems = this.stages.paySystemList ? this.stages.paySystemList.paySystems : null;

			if (!Type.isArrayFilled(paySystems))
			{
				return null;
			}

			const place = paySystems.findIndex((paySystem) => paySystem.ID === paySystemId);
			const rows = this.$el.querySelectorAll('.order-payment-method-list .order-pay-method-item-container');

			return place < 0 ? null : rows[place]?.querySelector('button') ?? null;
		},
		currentPS(selected, list)
		{
			return list.find(ps => ps.ID === selected);
		},
		prepareParamsStages(props)
		{
			throw new Error("Method 'initStages' must be overloaded")
		},
		setStageType(props)
		{
			throw new Error("Method 'setStageType' must be overloaded")
		}
		//endregion
	},
};
