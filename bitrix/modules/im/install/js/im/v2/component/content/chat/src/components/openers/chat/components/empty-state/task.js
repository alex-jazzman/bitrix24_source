import {
	BaseEmptyState,
	IconClass,
	EmptyStateListItemName,
	type EmptyStateListItem,
} from 'im.v2.component.content.elements';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

// @vue/component
export const TaskEmptyState = {
	name: 'TaskFeatureListEmptyState',
	components: { BaseEmptyState },
	computed: {
		IconClass: () => IconClass,
		isCopilotAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		},
		copilotTitle(): string
		{
			if (!this.isCopilotAvailable)
			{
				return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_UNAVAILABLE_COPILOT_TITLE_1');
			}

			return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_TITLE_1');
		},
		copilotSubtitle(): string
		{
			if (!this.isCopilotAvailable)
			{
				return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_UNAVAILABLE_COPILOT_SUBTITLE_1');
			}

			return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_SUBTITLE_1');
		},
		emptyStateListItems(): EmptyStateListItem[]
		{
			return [
				{
					title: this.copilotTitle,
					subtitle: this.copilotSubtitle,
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
