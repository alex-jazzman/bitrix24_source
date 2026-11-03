import type { ImModelMessage } from 'im.v2.model';

const SESSION_ID_PARAMS_KEY = 'imolSid';

// @vue/component
export const SessionNumberPlaque = {
	name: 'SessionNumberPlaque',
	props:
	{
		item: {
			type: Object,
			required: true,
		},
	},
	computed:
	{
		message(): ImModelMessage
		{
			return this.item;
		},
		sessionNumberText(): string
		{
			return this.loc('IM_MESSAGE_SUPPORT_SESSION_NUMBER_TEXT', {
				'#SESSION_NUMBER#': this.sessionNumber,
			});
		},
		sessionNumber(): string
		{
			return this.message.componentParams?.[SESSION_ID_PARAMS_KEY];
		},
	},
	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-message-support-session-number__container">
			<div class="bx-im-message-support-session-number__content">
				{{ sessionNumberText }}
			</div>
		</div>
	`,
};
