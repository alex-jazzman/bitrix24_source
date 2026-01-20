import { Loc } from 'main.core';

const MessageMixin = {
	watch:
		{
			isCompilationMode(compilationMode): void
			{
				if (this.messageSenderEditor)
				{
					const textModes = this.$root.$app.sendingMethodDesc.text_modes;
					const currentMessage = compilationMode ? textModes.compilation : textModes.payment;
					this.messageSenderEditor.setMessageText(currentMessage);
					this.$store.dispatch('orderCreation/setMessageData', { body: currentMessage });
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
	methods:
		{
			onMessageBodyChangeHandler(event)
			{
				const body = event.getData().body;
				this.$store.dispatch('orderCreation/setMessageData', { body });
				if (this.messageData.senderCode !== 'bitrix24')
				{
					this.$root.$app.sendingMethodDesc.text_modes[this.isCompilationMode ? 'compilation' : 'payment'] = body;
				}
			},
			setTemplateError(show: boolean): void
			{
				if (this.messageSenderEditor)
				{
					if (show)
					{
						if (!this.templateError)
						{
							this.templateError = true;
							this.messageSenderEditor.setError(
								Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER_TEMPLATE_ERROR'),
							);
						}
					}
					else if (this.templateError)
					{
						this.templateError = false;
						this.messageSenderEditor.resetAlert();
					}
				}
			},
		},
};

export {
	MessageMixin,
};
