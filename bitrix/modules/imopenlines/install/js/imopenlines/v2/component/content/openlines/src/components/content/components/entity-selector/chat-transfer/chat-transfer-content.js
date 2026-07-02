import { TagSelector } from 'ui.entity-selector';
import { type JsonObject } from 'main.core';

import { ChatButton, ButtonSize, ButtonColor } from 'im.v2.component.elements.button';
import { type ImModelUser } from 'im.v2.model';
import { AddToChatSearch as ChatSearch } from 'im.v2.component.search';

import { type ImolModelQueue } from 'imopenlines.v2.model';
import { TransferService } from 'imopenlines.v2.provider.service';

import { QueueSearch } from './components/queue-search';
import { QUEUE_ID_PREFIX } from './const/const';
import { type TagItemOptions } from './types/tag-item-options';

const SEARCH_ENTITY_USER = 'user';
const SEARCH_ENTITY_QUEUE = 'queue';

export const ChatTransferContent = {
	name: 'ChatTransferContent',
	components: { ChatButton, ChatSearch, QueueSearch },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			searchQuery: '',
			selectedItem: null,
		};
	},
	computed:
	{
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		selectedItems(): string[]
		{
			return this.selectedItem ? [this.selectedItem.id] : [];
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
	methods:
	{
		getTagSelector(): TagSelector
		{
			return new TagSelector({
				maxHeight: 150,
				showAddButton: false,
				showTextBox: true,
				showCreateButton: false,
				addButtonCaption: this.loc('IMOL_CHAT_TRANSFER_ENTITY_SELECTOR_INPUT'),
				events: {
					onContainerClick: () => {
						this.focusSelector();
					},
					onBlur: () => {
						if (this.membersSelector.getTextBoxValue().length > 0)
						{
							return;
						}

						this.membersSelector.hideTextBox();
						this.membersSelector.showAddButton();
					},
					onAfterTagRemove: (event) => {
						const { tag } = event.getData();
						if (this.selectedItem?.id === tag.id)
						{
							this.selectedItem = null;
						}
						this.focusSelector();
					},
					onInput: () => {
						this.searchQuery = this.membersSelector.getTextBoxValue();
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
		selectItem(tag: TagItemOptions, clearQuery: boolean)
		{
			this.membersSelector.removeTags();
			const isSameItem = this.selectedItem?.id === tag.id;
			if (!isSameItem)
			{
				this.membersSelector.addTag(tag);
				this.selectedItem = tag;
			}

			this.membersSelector.clearTextBox();

			if (clearQuery)
			{
				this.searchQuery = '';
			}
		},
		selectUser(event: {dialogId: string, nativeEvent: PointerEvent})
		{
			const { dialogId, nativeEvent } = event;
			const user: ImModelUser = this.$store.getters['users/get'](dialogId, true);

			this.selectItem(
				{
					id: dialogId,
					entityId: SEARCH_ENTITY_USER,
					title: user.name,
					avatar: user.avatar.length > 0 ? user.avatar : null,
				},
				!nativeEvent.altKey,
			);
		},
		selectQueue(event: {queueId: number, nativeEvent: PointerEvent})
		{
			const { queueId, nativeEvent } = event;
			const queue: ImolModelQueue = this.$store.getters['openLines/queue/getById'](queueId);
			const queueFullId = `${QUEUE_ID_PREFIX}${queueId}`;

			this.selectItem(
				{
					id: queueFullId,
					entityId: SEARCH_ENTITY_QUEUE,
					title: queue.lineName,
				},
				!nativeEvent.altKey,
			);
		},
		chatTransfer(): Promise<void>
		{
			return this.getTransferService().chatTransfer(this.dialogId, this.selectedItem.id);
		},
		getTransferService(): TransferService
		{
			if (!this.transferService)
			{
				this.transferService = new TransferService();
			}

			return this.transferService;
		},
		loc(key: string): string
		{
			return this.$Bitrix.Loc.getMessage(key);
		},
	},
	template: `
		<div class="bx-imol-chat-transfer-entity-selector__container">
			<div class="bx-imol-chat-transfer-entity-selector__input" ref="tag-selector"></div>
			<div class="bx-imol-chat-transfer-entity-selector__search-result-container">
				<QueueSearch
					:query="searchQuery"
					:selectedItems="selectedItems"
					@clickItem="selectQueue"
				/>
				<ChatSearch
					:query="searchQuery"
					:dialogId="dialogId"
					:selectedItems="selectedItems"
					@clickItem="selectUser"
				/>
			</div>
			<div class="bx-imol-chat-transfer-entity-selector__buttons">
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.Primary"
					:isRounded="true"
					:text="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
					:isDisabled="!selectedItem"
					@click="chatTransfer"
				/>
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.LightBorder"
					:isRounded="true"
					:text="loc('IMOL_ENTITY_SELECTOR_CHAT_TRANSFER_CANCEL_BUTTON')"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`,
};
