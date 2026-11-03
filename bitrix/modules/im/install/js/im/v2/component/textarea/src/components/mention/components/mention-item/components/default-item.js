import { Text } from 'main.core';

import { ChatTitleWithHighlighting } from 'im.v2.component.elements.chat-title';
import { ChatType } from 'im.v2.const';
import { highlightText } from 'im.v2.lib.text-highlighter';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

import { MentionItem } from './mention-item';
import { AddToChatDropdown } from './add-to-chat-dropdown';
import { canAddToChat } from '../../../helpers/can-add-to-chat';
import { type MentionItemType } from '../../../mention-content';

// @vue/component
export const DefaultItem = {
	name: 'DefaultMentionItem',
	components: { ChatTitleWithHighlighting, MentionItem, AddToChatDropdown },
	// Provided by the composer that owns the field: one set of ids per composer, see `createMentionGridIds`.
	inject: ['mentionGridIds'],
	props: {
		item: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
		index: {
			type: Number,
			required: true,
		},
		activeColumn: {
			type: Number,
			default: 0,
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
		itemDialog(): ImModelChat
		{
			return this.getDialog(this.item.id);
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
		nameCellId(): string
		{
			return this.mentionGridIds.getCellId(this.index, 0);
		},
		actionCellId(): string
		{
			return this.mentionGridIds.getCellId(this.index, 1);
		},
		actionButtonId(): string
		{
			return this.mentionGridIds.getActionButtonId(this.index);
		},
		// The two cells of the row light one at a time: while the action column is active the row keeps no
		// highlight of its own, or the keyboard position would read as two places at once.
		nameCellActive(): boolean
		{
			return this.selected && this.activeColumn === 0;
		},
		actionCellActive(): boolean
		{
			return this.selected && this.activeColumn === 1;
		},
		isAddingUserByMentionAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAddingUserByMentionAvailable);
		},
		canAddToChat(): boolean
		{
			if (this.isParticipant || !this.isAddingUserByMentionAvailable || !this.isItemUser)
			{
				return false;
			}

			return canAddToChat(this.dialogId, this.currentItem.id);
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
			:class="{'--selected': nameCellActive}"
			class="bx-im-mention-item__container bx-im-mention-item__scope"
			role="row"
		>
			<div :id="nameCellId" role="gridcell" class="bx-im-mention-item__name-cell">
				<MentionItem :id="currentItem.id">
					<template #title>
						<ChatTitleWithHighlighting
							:dialogId="currentItem.id"
							:textToHighlight="query"
							:text="currentItem.title"
							class="bx-im-mention-item__title"
							data-testid="im-mention-item-title"
						/>
					</template>
					<template #subtitle>
						<div
							v-if="isItemUser"
							class="bx-im-mention-item__subtitle"
							:title="currentItem.subtitle"
							v-html="subtitleWithHighlighting"
						></div>
						<div v-else class="bx-im-mention-item__subtitle" :title="currentItem.subtitle">{{ currentItem.subtitle }}</div>
					</template>
				</MentionItem>
			</div>
			<div
				v-if="canAddToChat"
				:id="actionCellId"
				role="gridcell"
				class="bx-im-mention-item__action-cell"
				:class="{'--active': actionCellActive}"
				data-testid="im-textarea-mention-item-action-cell"
			>
				<AddToChatDropdown
					:buttonId="actionButtonId"
					:dialogId="dialogId"
					:userId="currentItem.id"
					:searchQuery="query"
				/>
			</div>
		</div>
	`,
};
