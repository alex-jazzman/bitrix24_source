import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';

import '../css/empty-state.css';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: { RecentEmptyState },
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<RecentEmptyState
			class="bx-imol-list-recent-empty-state"
			:title="loc('IMOL_LIST_RECENT_EMPTY_MESSAGE_MSGVER_1')"
		/>
	`,
};
