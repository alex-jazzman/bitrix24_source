import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { Layout } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: { RecentEmptyState, UiButton },
	props: {
		folderId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
	},
	methods: {
		onAddChatsClick()
		{
			void LayoutManager.getInstance().setLayout({
				name: Layout.updateFolder,
				entityId: String(this.folderId),
			});
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<RecentEmptyState
			:title="loc('IM_LIST_FOLDER_EMPTY_STATE_TITLE')"
			:subtitle="loc('IM_LIST_FOLDER_EMPTY_STATE_SUBTITLE')"
			imageModifier="folder"
		>
			<UiButton
				:size="ButtonSize.MEDIUM"
				:text="loc('IM_LIST_FOLDER_EMPTY_STATE_ADD_CHATS')"
				:style="AirButtonStyle.OUTLINE_ACCENT_2"
				:dataset="{ testid: 'folder-empty-state-add-chats-btn' }"
				@click="onAddChatsClick"
			/>
		</RecentEmptyState>
	`,
};
