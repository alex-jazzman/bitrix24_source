import { BaseEmptyState, IconClass, EmptyStateListItemName } from './base/base';

import type { EmptyStateListItem } from './base/base';

// @vue/component
export const TaskEmptyState = {
	name: 'TaskFeatureListEmptyState',
	components: { BaseEmptyState },
	computed: {
		IconClass: () => IconClass,
		emptyStateListItems(): EmptyStateListItem[]
		{
			return [
				{
					title: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_TITLE_1'),
					subtitle: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_SUBTITLE_1'),
					name: EmptyStateListItemName.audio,
				},
				{
					title: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_SUBTITLE_2'),
					name: EmptyStateListItemName.messages,
				},
				{
					title: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_SUBTITLE_3'),
					name: EmptyStateListItemName.chat,
				},
			];
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseEmptyState
			:text="loc('IM_CONTENT_TASK_START_FEATURE_LIST_TITLE')"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		/>
	`,
};
