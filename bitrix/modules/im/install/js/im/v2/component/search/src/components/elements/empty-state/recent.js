import { BaseEmptyState } from './base';

// @vue/component
export const RecentEmptyState = {
	name: 'RecentEmptyState',
	components: { BaseEmptyState },
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseEmptyState :title="loc('IM_SEARCH_RESULT_NO_RECENT')" />
	`,
};
