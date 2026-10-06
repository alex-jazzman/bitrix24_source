import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';

/**
 * Reveals the Bcc field: the button stands in the subject row, the field in the recipient rows, and
 * `bccExpanded` is the only thing between them. Bcc never collapses back and the button is gone for good:
 * collapsing would drop the addresses already typed.
 */
// @vue/component
export const ShowBccButton = defineComponent({
	name: 'MailComposeShowBccButton',

	components: {
		UiButton,
	},

	setup()
	{
		return {
			state: useComposeState(),
			buttonStyle: AirButtonStyle.PLAIN_NO_ACCENT,
			buttonSize: ButtonSize.SMALL,
		};
	},

	computed: {
		isShown(): boolean
		{
			return !this.state.bccExpanded;
		},

		text(): string
		{
			return loc(Phrase.FieldBcc);
		},
	},

	methods: {
		handleClick(): void
		{
			this.state.bccExpanded = true;
		},
	},

	template: `
		<UiButton
			v-if="isShown"
			:text="text"
			:style="buttonStyle"
			:size="buttonSize"
			:dataset="{ testid: 'mail-compose-show-bcc' }"
			@click="handleClick"
		/>
	`,
});
