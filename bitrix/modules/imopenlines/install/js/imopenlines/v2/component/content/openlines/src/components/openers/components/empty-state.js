import {
	BaseEmptyState,
	IconClass,
	EmptyStateListItemName,
	type EmptyStateListItem,
} from 'im.v2.component.content.elements';
import { SelectableBackgroundId } from 'im.v2.lib.theme';

import '../css/empty-state.css';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: { BaseEmptyState },
	computed:
	{
		IconClass: () => IconClass,
		SelectableBackgroundId: () => SelectableBackgroundId,
		emptyStateListItems(): EmptyStateListItem[]
		{
			return [
				{
					title: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_TITLE_1'),
					subtitle: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_SUBTITLE_1'),
					name: EmptyStateListItemName.collaboration,
				},
				{
					title: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_TITLE_2'),
					subtitle: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_SUBTITLE_2'),
					name: EmptyStateListItemName.business,
				},
				{
					title: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_TITLE_3'),
					subtitle: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_SUBTITLE_3'),
					name: EmptyStateListItemName.result,
				},
			];
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseEmptyState
			:text="loc('IMOL_CONTENT_START_FEATURE_LIST_TITLE')"
			:backgroundId="SelectableBackgroundId.cornflower"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		/>
	`,
};
