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
		<div class="bx-im-list-copilot__empty">
			<div class="bx-im-list-copilot__empty_icon"></div>
			<div class="bx-im-list-copilot__empty_text">{{ loc('IM_LIST_COPILOT_EMPTY') }}</div>
		</div>
	`,
};
