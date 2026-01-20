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
			message: (state) => state.message.text,
		}),
		messageLengthCounter(): string
		{
			const colorStart = this.isOverflow ? '<span style="color: #d0011b;">' : '<span>';
			const colorEnd = '</span>';

			return Loc.getMessage(
				'CRM_MESSAGESENDER_EDITOR_COUNTER',
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
				Extension.getSettings('crm.messagesender.editor').get('recommendedMaxMessageLength'),
			);
		},
	},
	template: `
		<BText 
			size="sm"
			tag="div"
			className="crm-messagesender-editor__content__footer__text"
		><span v-html="messageLengthCounter"></span></BText>
	`,
};
