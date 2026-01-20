import { Core } from 'im.v2.application.core';

import { Messenger } from 'im.public';
import { Color, ActionByUserType, UserType } from 'im.v2.const';
import { ChatButton, ButtonSize, type CustomColorScheme } from 'im.v2.component.elements.button';
import { Analytics } from 'im.v2.lib.analytics';
import { PermissionManager } from 'im.v2.lib.permission';
import { CreatableChat } from 'im.v2.component.content.chat-forms.forms';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { SpecialBackground } from 'im.v2.lib.theme';

import { BaseEmptyState, IconClass, EmptyStateListItemName } from './base/base';

import type { EmptyStateListItem } from './base/base';

// @vue/component
export const CollabEmptyState = {
	name: 'CollabEmptyState',
	components: { ChatButton, BaseEmptyState },
	computed:
	{
		ButtonSize: () => ButtonSize,
		IconClass: () => IconClass,
		SpecialBackground: () => SpecialBackground,
		canCreateCollab(): boolean
		{
			const isAvailable = FeatureManager.isFeatureAvailable(Feature.collabCreationAvailable);
			const canCreate = PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCollab);

			return isAvailable && canCreate;
		},
		createButtonColorScheme(): CustomColorScheme
		{
			return {
				borderColor: Color.transparent,
				backgroundColor: Color.white,
				iconColor: Color.gray90,
				textColor: Color.gray90,
				hoverColor: Color.white,
				textHoverColor: Color.collab70,
			};
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
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_SUBTITLE_2'),
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
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_1'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_1'),
					name: EmptyStateListItemName.collaboration,
				},
				{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_2'),
					name: EmptyStateListItemName.business,
				},
				{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_3'),
					name: EmptyStateListItemName.result,
				},
			];
		},
		emptyStateListItems(): EmptyStateListItem[]
		{
			if (this.isCurrentUserCollaber)
			{
				return this.collaberEmptyStateListItems;
			}

			return this.baseEmptyStateListItems;
		},
		isCurrentUserCollaber(): boolean
		{
			const currentUser = this.$store.getters['users/get'](Core.getUserId(), true);

			return currentUser.type === UserType.collaber;
		},
	},
	methods:
	{
		onCreateClick()
		{
			Analytics.getInstance().chatCreate.onCollabEmptyStateCreateClick();
			Messenger.openChatCreation(CreatableChat.collab);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseEmptyState
			:text="loc('IM_CONTENT_COLLAB_START_TITLE_V2')"
			:backgroundId="SpecialBackground.collab"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		>
			<template #bottom-content>
				<ChatButton
					v-if="canCreateCollab"
					:size="ButtonSize.XXL"
					:customColorScheme="createButtonColorScheme"
					:text="loc('IM_CONTENT_COLLAB_START_CREATE_BUTTON')"
					:isRounded="true"
					@click="onCreateClick"
				/>
			</template>
		</BaseEmptyState>
	`,
};
