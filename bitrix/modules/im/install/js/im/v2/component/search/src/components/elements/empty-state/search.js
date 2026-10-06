import { BaseEmptyState } from './base';

// @vue/component
export const SearchEmptyState = {
	name: 'SearchEmptyState',
	components: { BaseEmptyState },
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseEmptyState
			:title="loc('IM_SEARCH_RESULT_NOT_FOUND')"
			:subtitle="loc('IM_SEARCH_RESULT_NOT_FOUND_DESCRIPTION')"
		/>
	`,
};
