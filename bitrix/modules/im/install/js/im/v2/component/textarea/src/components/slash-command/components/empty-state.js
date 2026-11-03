import '../css/slash-command-empty-state.css';

// @vue/component
export const EmptyState = {
	name: 'SlashCommandEmptyState',
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-slash-command-empty-state__container" data-testid="im-textarea-slash-command-empty">
			<span class="bx-im-slash-command-empty-state__icon"></span>
			<div class="bx-im-slash-command-empty-state__text-block">
				<span class="bx-im-slash-command-empty-state__title">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_EMPTY_STATE_TITLE') }}
				</span>
				<span class="bx-im-slash-command-empty-state__text">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_EMPTY_STATE_TEXT') }}
				</span>
			</div>
		</div>
	`,
};
