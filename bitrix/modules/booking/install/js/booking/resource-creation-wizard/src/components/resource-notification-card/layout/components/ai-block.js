import { MessageTemplate } from './message-tempalte';

// @vue/component
export const AiBlock = {
	name: 'AiBlock',
	components: {
		MessageTemplate,
	},
	props: {
		checked: {
			type: Boolean,
			required: true,
		},
		ordinal: {
			type: Number,
			required: true,
		},
	},
	computed: {
		description(): string
		{
			switch (this.ordinal)
			{
				case 1:
					return this.loc('BRCW_NOTIFICATION_CARD_MESSAGE_AI_DESCRIPTION_FIRST');
				case 2:
					return this.loc('BRCW_NOTIFICATION_CARD_MESSAGE_AI_DESCRIPTION_SECOND');
				case 3:
					return this.loc('BRCW_NOTIFICATION_CARD_MESSAGE_AI_DESCRIPTION_THIRD');
				default:
					return this.loc('BRCW_NOTIFICATION_CARD_MESSAGE_AI_DESCRIPTION_FOURTH');
			}
		},
	},
	methods: {
		getChooseTemplateButton(): HTMLElement | null
		{
			return this.$refs.chooseTemplateBtn || null;
		},
	},
	template: `
		<div class="resource-creation-wizard__form-notification-info --ai">
			<div class="resource-creation-wizard__form-notification-info-text-row">
				{{ loc('BRCW_NOTIFICATION_CARD_MESSAGE_AI_TEXT') }}
			</div>
			<MessageTemplate :text="description"/>
		</div>
	`,
};
