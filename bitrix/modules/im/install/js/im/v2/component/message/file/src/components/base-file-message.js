import { BaseMessage } from 'im.v2.component.message.base';
import { BaseFileItem, DefaultMessageContent, MessageHeader, MessageFooter } from 'im.v2.component.message.elements';
import { FileType } from 'im.v2.const';
import { type ImModelMessage, type ImModelFile } from 'im.v2.model';

import { BaseFileContextMenu } from '../classes/base-file-context-menu';

import '../css/base-file-message.css';

// @vue/component
export const BaseFileMessage = {
	name: 'BaseFileMessage',
	components: {
		BaseMessage,
		DefaultMessageContent,
		BaseFileItem,
		MessageHeader,
		MessageFooter,
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['cancelClick'],
	computed:
	{
		FileType: () => FileType,
		message(): ImModelMessage
		{
			return this.item;
		},
		messageFile(): ImModelFile
		{
			const firstFileId = this.message.files[0];

			return this.$store.getters['files/get'](firstFileId, true);
		},
	},
	created()
	{
		this.contextMenu = new BaseFileContextMenu();
	},
	beforeUnmount()
	{
		this.contextMenu.destroy();
	},
	methods:
	{
		onOpenContextMenu({ event, fileId }: { event: PointerEvent, fileId: number })
		{
			const context = { dialogId: this.dialogId, fileId, ...this.message };
			this.contextMenu.openMenu(context, event.target);
		},
		onCancel(event)
		{
			this.$emit('cancelClick', event);
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId">
			<div class="bx-im-message-base-file__container">
				<MessageHeader :withTitle="withTitle" :item="item" class="bx-im-message-base-file__author-title" />
				<BaseFileItem
					:key="messageFile.id"
					:id="messageFile.id"
					:messageId="message.id"
					@openContextMenu="onOpenContextMenu"
					@cancelClick="onCancel"
				/>
				<DefaultMessageContent :item="item" :dialogId="dialogId" />
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
		</BaseMessage>
	`,
};
