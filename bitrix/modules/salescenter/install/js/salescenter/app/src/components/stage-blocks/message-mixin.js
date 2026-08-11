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

						return `[placeholder code=LINK removable=false copyable=false]${caption}[/placeholder]`;
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
