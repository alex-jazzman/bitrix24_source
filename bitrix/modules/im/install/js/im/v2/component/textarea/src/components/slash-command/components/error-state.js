import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { ChatButton, ButtonSize, ButtonColor } from 'im.v2.component.elements.button';

import '../css/slash-command-error-state.css';

const ICON_SIZE = 24;

// @vue/component
export const ErrorState = {
	name: 'SlashCommandErrorState',
	components: { BIcon, ChatButton },
	emits: ['retry'],
	setup(): Object
	{
		return { OutlineIcons, ButtonSize, ButtonColor, ICON_SIZE };
	},
	methods: {
		onRetry(): void
		{
			this.$emit('retry');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-slash-command-error-state__container" data-testid="im-textarea-slash-command-error">
			<BIcon
				:name="OutlineIcons.EXCLAMATION_CIRCLE"
				:size="ICON_SIZE"
				class="bx-im-slash-command-error-state__icon"
			/>
			<div class="bx-im-slash-command-error-state__content">
				<span class="bx-im-slash-command-error-state__text">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_ERROR_STATE') }}
				</span>
				<ChatButton
					:size="ButtonSize.S"
					:color="ButtonColor.Link"
					:text="loc('IM_TEXTAREA_SLASH_COMMAND_ERROR_RETRY')"
					data-testid="im-textarea-slash-command-retry-btn"
					@click="onRetry"
				/>
			</div>
		</div>
	`,
};
