import { Extension, Loc, Text } from 'main.core';
import { Text as BText } from 'ui.system.typography.vue';
import { mapState } from 'ui.vue3.vuex';

// @vue/component
export const LengthCounter = {
	name: 'LengthCounter',
	components: {
		BText,
	},
	computed: {
		...mapState({
			rawText: (state) => state.message.text,
		}),
		message(): string
		{
			return this.$Bitrix.Data.get('locator').getPlaceholderService().toDisplayText(this.rawText);
		},
		messageLengthCounter(): string
		{
			const colorStart = this.isOverflow ? '<span style="color: #d0011b;">' : '<span>';
			const colorEnd = '</span>';

			return Loc.getMessage(
				'MESSAGESERVICE_MESSAGE_EDITOR_COUNTER',
				{
					'[color]': colorStart,
					'#COUNT#': Text.toInteger(this.message.length),
					'[/color]': colorEnd,
					'#MAX#': this.recommendedMaxMessageLength,
				},
			);
		},
		isOverflow(): boolean
		{
			return this.message.length > this.recommendedMaxMessageLength;
		},
		recommendedMaxMessageLength(): number
		{
			return Text.toInteger(
				Extension.getSettings('messageservice.message.editor').get('recommendedMaxMessageLength'),
			);
		},
	},
	template: `
		<BText 
			size="sm"
			tag="div"
			className="messageservice-message-editor__content__footer__text"
		><span v-html="messageLengthCounter"></span></BText>
	`,
};
