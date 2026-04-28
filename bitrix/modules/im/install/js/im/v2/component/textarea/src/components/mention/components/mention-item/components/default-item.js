import { Text } from 'main.core';

import { ChatTitleWithHighlighting } from 'im.v2.component.elements.chat-title';
import { ActionByRole, ActionByUserType, ChatType } from 'im.v2.const';
import { highlightText } from 'im.v2.lib.text-highlighter';
import { PermissionManager } from 'im.v2.lib.permission';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { MentionItem } from './mention-item';
import { AddToChatDropdown } from './add-to-chat-dropdown';

import type { ImModelChat } from 'im.v2.model';
import type { MentionItemType } from '../../../mention-content';

// @vue/component
export const DefaultItem = {
	name: 'DefaultMentionItem',
	components: { ChatTitleWithHighlighting, MentionItem, AddToChatDropdown },
	props: {
		item: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
		query: {
			type: String,
			default: '',
		},
		dialogId: {
			type: String,
			required: true,
		},
		isParticipant: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.getDialog(this.dialogId);
		},
		itemDialog(): ImModelChat
		{
			return this.getDialog(this.item.id);
		},
		isChatUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isItemUser(): boolean
		{
			return this.itemDialog.type === ChatType.user;
		},
		subtitleWithHighlighting(): string
		{
			return highlightText(Text.encode(this.item.subtitle), this.query);
		},
		currentItem(): MentionItemType
		{
			return this.item;
		},
		isAddingUserByMentionAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAddingUserByMentionAvailable);
		},
		canAddToChat(): boolean
		{
			if (!this.isAddingUserByMentionAvailable)
			{
				return false;
			}

			if (!this.isItemUser || this.isParticipant)
			{
				return false;
			}

			const canCreateChat = PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createChat);
			if (this.isChatUser && !canCreateChat)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.extend, this.dialogId);
		},
	},
	methods: {
		getDialog(dialogId: string): ImModelChat
		{
			return this.$store.getters['chats/get'](dialogId, true);
		},
	},
	template: `
		<div
			:class="{'--selected': selected}"
			class="bx-im-mention-item__container bx-im-mention-item__scope"
		>
			<MentionItem :id="currentItem.id">
				<template #title>
					<ChatTitleWithHighlighting
						:dialogId="currentItem.id"
						:textToHighlight="query"
						:text="currentItem.title"
						class="bx-im-mention-item__title"
					/>
				</template>
				<template #subtitle>
					<div v-if="isItemUser" class="bx-im-mention-item__subtitle" :title="currentItem.subtitle" v-html="subtitleWithHighlighting"></div>
					<div v-else class="bx-im-mention-item__subtitle" :title="currentItem.subtitle">{{ currentItem.subtitle }}</div>
				</template>
			</MentionItem>
			<AddToChatDropdown v-if="canAddToChat" :dialogId="dialogId" :userId="currentItem.id" />
		</div>
	`,
};
