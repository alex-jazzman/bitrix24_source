import { Messenger } from 'im.public';
import { Color, ActionByUserType } from 'im.v2.const';
import { ChatButton, ButtonSize, type CustomColorScheme } from 'im.v2.component.elements.button';
import { BaseEmptyState, IconClass, EmptyStateListItemName, type EmptyStateListItem } from 'im.v2.component.content.elements';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { CreatableChatType } from 'im.v2.lib.create-chat';
import { SpecialBackground } from 'im.v2.lib.theme';
import { CollabManager } from 'im.v2.lib.collab';

// @vue/component
export const CollabV2EmptyState = {
	name: 'CollabV2EmptyState',
	components: { ChatButton, BaseEmptyState },
	computed: {
		ButtonSize: () => ButtonSize,
		IconClass: () => IconClass,
		SpecialBackground: () => SpecialBackground,
		canCreateCollab(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCollab);
		},
		isCopilotAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		},
		createButtonColorScheme(): CustomColorScheme
		{
			return {
				borderColor: Color.transparent,
				backgroundColor: Color.white,
				iconColor: Color.gray90,
				textColor: Color.gray90,
				hoverColor: Color.white,
				textHoverColor: Color.accentMainPrimaryAlt,
			};
		},
		copilotTitle(): string
		{
			if (!this.isCopilotAvailable)
			{
				return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_UNAVAILABLE_COPILOT_TITLE_1');
			}

			return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_TITLE_1');
		},
		copilotSubtitle(): string
		{
			if (!this.isCopilotAvailable)
			{
				return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_UNAVAILABLE_COPILOT_SUBTITLE_1');
			}

			return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_SUBTITLE_1');
		},
		collaberEmptyStateListItems(): EmptyStateListItem[]
		{
			return [
				{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_TITLE_1'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_1'),
					name: EmptyStateListItemName.collaboration,
				},
				{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_COLLABER_SUBTITLE_2'),
					name: EmptyStateListItemName.business,
				},
				{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_3'),
					name: EmptyStateListItemName.result,
				},
			];
		},
		baseEmptyStateListItems(): EmptyStateListItem[]
		{
			return [
				{
					title: this.copilotTitle,
					subtitle: this.copilotSubtitle,
					name: EmptyStateListItemName.copilot,
				},
				{
					title: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_SUBTITLE_2'),
					name: EmptyStateListItemName.messages,
				},
				{
					title: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_SUBTITLE_3'),
					name: EmptyStateListItemName.list,
				},
			];
		},
		emptyStateListItems(): EmptyStateListItem[]
		{
			if (CollabManager.isCurrentUserGuest())
			{
				return this.collaberEmptyStateListItems;
			}

			return this.baseEmptyStateListItems;
		},
	},
	methods: {
		onCreateClick()
		{
			Analytics.getInstance().chatCreate.onCollabEmptyStateCreateClick();
			void Messenger.openChatCreation(CreatableChatType.collab);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseEmptyState
			:text="loc('IM_CONTENT_COLLAB_V2_START_TITLE')"
			:backgroundId="SpecialBackground.collabV2"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		>
			<template #bottom-content>
				<ChatButton
					v-if="canCreateCollab"
					:size="ButtonSize.XXL"
					:customColorScheme="createButtonColorScheme"
					:text="loc('IM_CONTENT_COLLAB_V2_START_CREATE_BUTTON')"
					:isRounded="true"
					@click="onCreateClick"
				/>
			</template>
		</BaseEmptyState>
	`,
};
