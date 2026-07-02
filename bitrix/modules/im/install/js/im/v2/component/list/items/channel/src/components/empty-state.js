import '../css/empty-state.css';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-channel__empty">
			<div class="bx-im-list-channel__empty_icon"></div>
			<div class="bx-im-list-channel__empty_text">{{ loc('IM_LIST_CHANNEL_EMPTY') }}</div>
		</div>
	`,
};
