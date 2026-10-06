import { Loc, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

const PAYMENT_SEND_EVENT = 'salescenter.app:onbeforepaymentsend';

const MessageMixin = {
	watch:
		{
			isCompilationMode(compilationMode): void
			{
				if (this.messageSenderEditor)
				{
					const textModes = this.$root.$app.sendingMethodDesc.text_modes;
					const currentMessage = compilationMode ? textModes.compilation : textModes.payment;
					const bbcodeMessage = this.convertLegacyTemplateToBBCode(currentMessage);
					this.messageSenderEditor.setMessageText(bbcodeMessage);
					this.$store.dispatch('orderCreation/setMessageData', {
						body: bbcodeMessage,
					});
				}
			},
		},
	computed:
		{
			messageSenderAvailable(): boolean
			{
				return BX.type.isObject(this.messageSenderData);
			},
			messageSenderId(): string
			{
				return this.messageSenderData.renderTo.replace('#', '');
			},
			isCompilationMode(): boolean
			{
				return this.$store.getters['orderCreation/isCompilationMode'];
			},
			messageData()
			{
				return this.$store.getters['orderCreation/getMessageData'];
			},
		},
	mounted()
	{
		if (this.messageSenderAvailable)
		{
			// Payment send is host-driven and never emits the editor's `onSend`,
			// so bridge it to handleSendAttempt() across all editor-owning variants
			// (deal-receiving-payment, crm-entity-create-payment, chat-receiving-payment).
			// handleSendAttempt() comes from a newer crm bundle.
			this.onBeforePaymentSendHandler = () => {
				if (Type.isFunction(this.messageSenderEditor?.handleSendAttempt))
				{
					this.messageSenderEditor.handleSendAttempt();
				}
			};
			EventEmitter.subscribe(PAYMENT_SEND_EVENT, this.onBeforePaymentSendHandler);
		}
	},
	beforeDestroy()
	{
		if (this.onBeforePaymentSendHandler)
		{
			EventEmitter.unsubscribe(PAYMENT_SEND_EVENT, this.onBeforePaymentSendHandler);
			this.onBeforePaymentSendHandler = null;
		}
	},
	methods:
		{
			convertLegacyTemplateToBBCode(template: string): string
			{
				const caption = Loc.getMessage('SALESCENTER_TEMPLATE_PLACEHOLDER_LINK');
				let isFirstOccurrence = true;

				return template.replaceAll('#LINK#', (): string => {
					if (isFirstOccurrence)
					{
						isFirstOccurrence = false;

						return `[placeholder code=LINK removable=false copyable=false salescenterPaymentLink=true]${caption}[/placeholder]`;
					}

					return caption;
				});
			},
			onMessageBodyChangeHandler(event)
			{
				const body = event.getData().body;
				this.$store.dispatch('orderCreation/setMessageData', { body });
				if (this.messageData.senderCode !== 'bitrix24')
				{
					this.$root.$app.sendingMethodDesc.text_modes[this.isCompilationMode ? 'compilation' : 'payment'] = body;
				}
			},
		},
};

export {
	MessageMixin,
};
