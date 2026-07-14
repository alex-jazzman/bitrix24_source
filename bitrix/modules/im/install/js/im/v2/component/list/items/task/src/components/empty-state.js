import { RecentType } from 'im.v2.const';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: { RecentEmptyState },
	computed: {
		RecentType: () => RecentType,
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<RecentEmptyState 
			:title="loc('IM_LIST_TASK_EMPTY_STATE_TITLE_MSGVER_1')"
			:subtitle="loc('IM_LIST_TASK_EMPTY_STATE_SUBTITLE')"
			:recentSection="RecentType.taskComments"
		/>
	`,
};
