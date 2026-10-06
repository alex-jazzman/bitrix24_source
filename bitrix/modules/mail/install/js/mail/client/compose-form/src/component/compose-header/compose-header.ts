import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { HeadlineLg } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { type ComposeScenario, Phrase, Scenario } from '../../const';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';

const titlePhrase: Record<ComposeScenario, string> = {
	[Scenario.New]: Phrase.TitleNew,
	[Scenario.Reply]: Phrase.TitleReply,
	[Scenario.ReplyAll]: Phrase.TitleReply,
	[Scenario.Forward]: Phrase.TitleForward,
};

/**
 * The title arrives with the payload, localized by the server. When the server has no title phrase for the
 * portal language it comes empty, and the scenario picks the fallback phrase here.
 */
// @vue/component
export const ComposeHeader = defineComponent({
	name: 'MailComposeHeader',

	components: {
		BIcon,
		HeadlineLg,
	},

	setup()
	{
		return {
			state: useComposeState(),
			iconName: Outline.MAIL_SEND,
		};
	},

	computed: {
		title(): string
		{
			return this.state.title || loc(titlePhrase[this.state.scenario]);
		},
	},

	template: `
		<div class="mail-compose-header" data-testid="mail-compose-header">
			<BIcon
				class="mail-compose-header__icon"
				:name="iconName"
				:size="24"
				data-testid="mail-compose-header-icon"
			/>
			<HeadlineLg data-testid="mail-compose-header-title">{{ title }}</HeadlineLg>
		</div>
	`,
});
