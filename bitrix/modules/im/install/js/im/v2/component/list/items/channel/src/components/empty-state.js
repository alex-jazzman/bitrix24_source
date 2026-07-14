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
			:title="loc('IM_LIST_CHANNEL_EMPTY_TITLE')"
			:subtitle="loc('IM_LIST_CHANNEL_EMPTY_SUBTITLE')"
			:recentSection="RecentType.openChannel" 
		/>
	`,
};
