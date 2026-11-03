import { Type } from 'main.core';
import { type UploaderFile } from 'ui.uploader.core';

import { UnsupportedMessage } from 'im.v2.component.message.unsupported';
import { FileType } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage, type ImModelFile, type ImModelChat } from 'im.v2.model';
import { UploadingService } from 'im.v2.provider.service.uploading';

import { AudioMessage } from './components/audio-message';
import { BaseFileMessage } from './components/base-file-message';
import { FileCollectionMessage } from './components/file-collection-message';
import { MediaContent } from './components/media-content';
import { MediaMessage } from './components/media-message';
import { VideoNoteMessage } from './components/video-note-message';

const FileMessageType = Object.freeze({
	media: 'MediaMessage',
	audio: 'AudioMessage',
	base: 'BaseFileMessage',
	collection: 'FileCollectionMessage',
	videoNote: 'VideoNoteMessage',
});

// @vue/component
export const FileMessage = {
	name: 'FileMessage',
	components: {
		BaseFileMessage,
		MediaMessage,
		AudioMessage,
		UnsupportedMessage,
		FileCollectionMessage,
		VideoNoteMessage,
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
		containerHeight: {
			type: [Number, null],
			default: null,
		},
	},
	computed:
	{
		FileType: () => FileType,
		message(): ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.item.id);
		},
		messageFiles(): ImModelFile[]
		{
			return this.$store.getters['messages/getMessageFiles'](this.item.id);
		},
		isGallery(): boolean
		{
			return Utils.file.isGallery(this.messageFiles);
		},
		componentName(): ?string
		{
			if (this.messageFiles.length > 1)
			{
				return this.isGallery ? FileMessageType.media : FileMessageType.collection;
			}

			const file = this.messageFiles[0];
			// The composition of an edited message is in the model before the files it added are:
			// until they arrive there is no attachment to pick a component for
			if (!file)
			{
				return null;
			}

			const hasPreview = Boolean(file.image);

			if (file.isVideoNote)
			{
				// VideoNoteMessage does not accept the before-message slot (it uses BaseMessage's
				// before-message for its own overlay header), so forwarded slot content is dropped here.
				return FileMessageType.videoNote;
			}

			// A record reaches the chat in whatever container the browser wrote it, and the storage
			// reads the kind of a file from its extension: until the server brings the record to the
			// target format, the very same voice message is typed as video. It is routed by what it
			// is and not by the container it arrived in, or the player, the duration and the
			// transcription of a record on the server path would all be lost.
			if (file.isVoiceNote)
			{
				return FileMessageType.audio;
			}

			if (file.type === FileType.image && hasPreview)
			{
				return FileMessageType.media;
			}

			if (file.type === FileType.audio)
			{
				return FileMessageType.audio;
			}

			if (file.type === FileType.video && hasPreview)
			{
				return FileMessageType.media;
			}

			return FileMessageType.base;
		},
		isRealMessage(): boolean
		{
			return this.$store.getters['messages/isRealMessage'](this.message.id);
		},
	},
	methods: {
		onCancel(event: { file: ImModelFile })
		{
			const canceledFileId: string = event.file.id;
			const uploadingService: UploadingService = UploadingService.getInstance();
			const uploaderId: string = uploadingService.getUploaderIdByFileId(canceledFileId);

			uploadingService.removeFileFromUploader({
				uploaderId,
				filesIds: [canceledFileId],
				restartUploading: true,
			});

			const uploaderFiles: Array<UploaderFile> = uploadingService.getFiles(uploaderId);
			if (Type.isArrayFilled(uploaderFiles))
			{
				const actualMessageFiles: Array<string> = uploaderFiles.map((file: UploaderFile) => {
					return file.getId();
				});

				void this.$store.dispatch('messages/update', {
					id: this.message.id,
					fields: {
						files: actualMessageFiles,
					},
				});
			}
			else
			{
				const chatId: number = this.message.chatId;
				void this.$store.dispatch('messages/delete', { id: this.message.id });

				const chat: ImModelChat = this.$store.getters['chats/getByChatId'](chatId);
				const lastMessageId: string | number | null = this.$store.getters['messages/findLastChatMessageId'](chatId);

				if (Type.isString(lastMessageId) || Type.isNumber(lastMessageId))
				{
					void this.$store.dispatch('recent/update', {
						dialogId: chat.dialogId,
						fields: { messageId: lastMessageId },
					});
				}
				else
				{
					void this.$store.dispatch('recent/hide', { dialogId: chat.dialogId });
				}
			}
		},
	},
	template: `
		<component
			v-if="componentName"
			:is="componentName"
			:item="message"
			:dialogId="dialogId"
			:withTitle="withTitle" 
			:containerHeight="containerHeight"
			:withContextMenu="isRealMessage"
			@cancelClick="onCancel"
		>
			<template v-if="$slots['before-message']" #before-message>
				<slot name="before-message"/>
			</template>
		</component>
	`,
};

export { MediaContent };
