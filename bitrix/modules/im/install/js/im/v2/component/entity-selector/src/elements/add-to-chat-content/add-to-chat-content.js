import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { TagSelector } from 'ui.entity-selector';
import { AirButtonStyle, Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';

import { Analytics } from 'im.v2.lib.analytics';
import { ChatType, EventType, UserType } from 'im.v2.const';
import { AddToChatSearch as AddToChat } from 'im.v2.component.search';
import { ChannelManager } from 'im.v2.lib.channel';
import { ChatAccessManager } from 'im.v2.lib.access';
import { type ImModelChat, type ImModelUser } from 'im.v2.model';

import './add-to-chat-content.css';

const SEARCH_ENTITY_ID = 'user';

// @vue/component
export const AddToChatContent = {
	name: 'AddToChatContent',
	components: { AddToChat, UiButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['inviteMembers', 'close'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			searchQuery: '',
			showHistory: true,
			selectedItems: new Set(),
		};
	},
	computed: {
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		ButtonStyle: () => AirButtonStyle,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isChat(): boolean
		{
			return this.dialog.type !== ChatType.user;
		},
		isCollab(): boolean
		{
			return this.dialog.type === ChatType.collab;
		},
		isOpenLines(): boolean
		{
			return this.dialog.type === ChatType.lines;
		},
		isChannel(): boolean
		{
			return ChannelManager.isChannel(this.dialogId);
		},
		showHistoryOption(): boolean
		{
			return !this.isCollab && this.isChat && !this.isChannel && !this.isOpenLines;
		},
	},
	created()
	{
		this.membersSelector = this.getTagSelector();
	},
	mounted()
	{
		this.membersSelector.renderTo(this.$refs['tag-selector']);
		this.membersSelector.focusTextBox();
	},
	beforeUnmount()
	{
		Analytics.getInstance().userAdd.onClosePopup();
	},
	activated()
	{
		this.membersSelector.hideAddButton();
		this.membersSelector.showTextBox();
		this.membersSelector.focusTextBox();
	},
	methods: {
		getTagSelector(): TagSelector
		{
			let timeoutId = null;

			return new TagSelector({
				maxHeight: 111,
				showAddButton: false,
				showTextBox: true,
				addButtonCaption: this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MSGVER_1'),
				addButtonCaptionMore: this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MORE'),
				showCreateButton: false,
				events: {
					onBeforeTagAdd: () => {
						clearTimeout(timeoutId);
					},
					onAfterTagAdd: (event) => {
						const { tag } = event.getData();
						this.selectedItems.add(tag.id);
						this.focusSelector();
					},
					onKeyUp: (event) => {
						const { event: keyboardEvent } = event.getData();
						this.getEmitter().emit(EventType.search.keyPressed, { keyboardEvent });
					},
					onBeforeTagRemove: () => {
						clearTimeout(timeoutId);
					},
					onAfterTagRemove: (event) => {
						const { tag } = event.getData();
						this.selectedItems.delete(tag.id);
						this.focusSelector();
					},
					onInput: () => {
						Analytics.getInstance().userAdd.onStartSearch({ dialogId: this.dialogId });
						this.searchQuery = this.membersSelector.getTextBoxValue().trim().toLowerCase();
					},
					onBlur: () => {
						const inputText = this.membersSelector.getTextBoxValue();
						if (inputText.length > 0)
						{
							return;
						}

						timeoutId = setTimeout(() => {
							this.membersSelector.hideTextBox();
							this.membersSelector.showAddButton();
						}, 200);
					},
					onContainerClick: () => {
						this.focusSelector();
					},
				},
			});
		},
		focusSelector()
		{
			this.membersSelector.hideAddButton();
			this.membersSelector.showTextBox();
			this.membersSelector.focusTextBox();
		},
		onSelectItem(event: {dialogId: string, service: Object, selectedStatus: boolean})
		{
			const { dialogId, nativeEvent } = event;
			if (this.selectedItems.has(dialogId))
			{
				const tag = {
					id: dialogId,
					entityId: SEARCH_ENTITY_ID,
				};

				this.membersSelector.removeTag(tag);
			}
			else
			{
				const tag = this.getTagByDialogId(dialogId);
				this.membersSelector.addTag(tag);
			}

			this.membersSelector.clearTextBox();
			if (!nativeEvent.altKey)
			{
				this.searchQuery = '';
			}
		},
		getTagByDialogId(dialogId: string): Object
		{
			const user: ImModelUser = this.$store.getters['users/get'](dialogId, true);
			const isExtranet = user.type === UserType.extranet;
			const entityType = isExtranet ? 'extranet' : 'employee';

			return {
				id: dialogId,
				entityId: SEARCH_ENTITY_ID,
				entityType,
				title: user.name,
				avatar: user.avatar.length > 0 ? user.avatar : null,
			};
		},
		async onInviteClick()
		{
			const members = [...this.selectedItems];

			this.isLoading = true;
			const canAdd = await ChatAccessManager.canAddUsers(this.dialogId, members);
			if (!canAdd)
			{
				this.isLoading = false;

				return;
			}

			this.isLoading = false;
			this.$emit('inviteMembers', { members, showHistory: this.showHistory });
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(key: string): string
		{
			return this.$Bitrix.Loc.getMessage(key);
		},
	},
	template: `
		<div class="bx-im-entity-selector-add-to-chat__container">
			<div class="bx-im-entity-selector-add-to-chat__input" ref="tag-selector"></div>
			<div v-if="showHistoryOption" class="bx-im-entity-selector-add-to-chat__show-history">
				<input type="checkbox" id="bx-im-entity-selector-add-to-chat-show-history" v-model="showHistory">
				<label for="bx-im-entity-selector-add-to-chat-show-history">
					{{ loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SHOW_HISTORY_MSGVER_1')}}
				</label>
			</div>
			<div class="bx-im-entity-selector-add-to-chat__search-result-container">
				<AddToChat
					:query="searchQuery"
					:dialogId="dialogId"
					:selectedItems="[...selectedItems]"
					@clickItem="onSelectItem"
				/>
			</div>
			<div class="bx-im-entity-selector-add-to-chat__buttons">
				<UiButton
					:size="ButtonSize.LARGE"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_BUTTON')"
					:loading="isLoading"
					:disabled="selectedItems.size === 0"
					:style="ButtonStyle.FILLED"
					@click="onInviteClick"
				/>
				<UiButton
					:size="ButtonSize.LARGE"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
					:style="ButtonStyle.PLAIN"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`,
};
