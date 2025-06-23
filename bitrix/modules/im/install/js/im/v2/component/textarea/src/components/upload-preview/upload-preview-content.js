import { Extension, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventType, FileType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { isNewLineCombination, isSendMessageCombination } from 'im.v2.lib.hotkey';
import { Textarea } from 'im.v2.lib.textarea';
import { UploadingService } from 'im.v2.provider.service.uploading';
import { MediaContent } from 'im.v2.component.message.file';
import { MediaGallery } from 'im.v2.component.elements.media-gallery';

import { ResizeDirection, ResizeManager } from '../../classes/resize-manager';
import { SendButton } from '../send-button';
import { FileItem } from './file-item';

import '../../css/upload-preview/upload-preview-content.css';

import type { JsonObject } from 'main.core';
import type { ImModelFile } from 'im.v2.model';
import type { UploaderFile } from 'ui.uploader.core';

const MAX_FILES_COUNT = 100;
const BUTTONS_CONTAINER_HEIGHT = 74;
const TextareaHeight = {
	max: 208,
	min: 46,
};

// @vue/component
export const UploadPreviewContent = {
	name: 'UploadPreviewContent',
	components: { MediaContent, FileItem, SendButton, MediaGallery },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		uploaderIds: {
			type: Array,
			required: true,
		},
		sourceFilesCount: {
			type: Number,
			required: true,
		},
		textareaValue: {
			type: String,
			required: false,
			default: '',
		},
	},
	emits: ['sendFiles', 'close', 'updateTitle'],
	data(): JsonObject
	{
		return {
			text: '',
			sendAsFile: false,
			uploaderFiles: [],
			chunks: [],
			textareaHeight: TextareaHeight.min,
			textareaResizedHeight: 0,
		};
	},
	computed:
	{
		isOverMaxFilesLimit(): boolean
		{
			return this.sourceFilesCount > MAX_FILES_COUNT;
		},
		isMediaOnly(): boolean
		{
			return this.chunks.flat().every((file: ImModelFile) => {
				return (file.type === FileType.image || file.type === FileType.video);
			});
		},
		inputMaxLength(): number
		{
			const settings = Extension.getSettings('im.v2.component.textarea');

			return settings.get('maxLength');
		},
		textareaHeightStyle(): number | string
		{
			return this.textareaHeight === 'auto' ? 'auto' : `${this.textareaHeight}px`;
		},
		title(): string
		{
			const filesCount: number = Math.min(this.uploaderFiles.length, MAX_FILES_COUNT);

			return this.$Bitrix.Loc.getMessage(
				'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_COMPUTED_TITLE',
				{ '#COUNT#': filesCount },
			);
		},
	},
	watch:
	{
		text()
		{
			void this.adjustTextareaHeight();
		},
		title()
		{
			this.$emit('updateTitle', this.title);
		},
		sendAsFile(newValue: boolean)
		{
			this.uploaderFiles.forEach((file: UploaderFile) => {
				file.setCustomData('sendAsFile', newValue);
			});
		},
	},
	created()
	{
		this.initResizeManager();

		this.uploaderIds.forEach((uploaderId) => {
			const files = [];
			this.getUploadingService().getFiles(uploaderId).forEach((file) => {
				this.uploaderFiles.push(file);

				files.push(this.$store.getters['files/get'](file.getId()));
			});

			this.chunks.push(files);
		});
	},
	mounted()
	{
		this.text = this.textareaValue;
		this.insertText('');
		this.$refs.messageText.focus();
	},
	beforeUnmount()
	{
		this.insertText(this.text);
		DraftManager.getInstance().setDraftText(this.dialogId, this.text);
		this.resizeManager.destroy();
	},
	methods:
	{
		async adjustTextareaHeight()
		{
			this.textareaHeight = 'auto';
			await this.$nextTick();

			if (!this.$refs.messageText)
			{
				return;
			}

			const TEXTAREA_BORDERS_WIDTH = 2;
			const newMaxPoint = Math.min(TextareaHeight.max, this.$refs.messageText.scrollHeight + TEXTAREA_BORDERS_WIDTH);
			if (this.doesContentOverflowScreen(newMaxPoint))
			{
				const textareaTopPoint = this.$refs.messageText.getBoundingClientRect().top;
				const availableHeight = window.innerHeight - textareaTopPoint - BUTTONS_CONTAINER_HEIGHT;
				this.textareaHeight = Math.max(TextareaHeight.min, availableHeight);

				return;
			}

			if (this.resizedTextareaHeight)
			{
				this.textareaHeight = Math.max(newMaxPoint, this.resizedTextareaHeight);

				return;
			}

			this.textareaHeight = Math.max(newMaxPoint, TextareaHeight.min);
		},
		getUploadingService(): UploadingService
		{
			if (!this.uploadingService)
			{
				this.uploadingService = UploadingService.getInstance();
			}

			return this.uploadingService;
		},
		onCancel()
		{
			this.$emit('close', { text: this.text });
		},
		onSend()
		{
			if (this.sendAsFile || !this.isMediaOnly)
			{
				this.uploaderFiles.forEach((file: UploaderFile) => {
					this.removePreviewParams(file);
				});
			}

			const filteredUploaderIds: Array<string> = this.uploaderIds.filter((uploaderId: string) => {
				return this.getUploadingService().getFiles(uploaderId).length > 0;
			});

			this.$emit('sendFiles', {
				text: this.text,
				uploaderIds: filteredUploaderIds,
				sendAsFile: this.sendAsFile,
			});

			this.text = '';
		},
		onKeyDownHandler(event: KeyboardEvent)
		{
			const sendMessageCombination = isSendMessageCombination(event);
			const newLineCombination = isNewLineCombination(event);
			if (sendMessageCombination && !newLineCombination)
			{
				event.preventDefault();
				this.onSend();

				return;
			}

			if (newLineCombination)
			{
				event.preventDefault();
				this.text = Textarea.addNewLine(this.$refs.messageText);
			}
		},
		removePreviewParams(file: UploaderFile)
		{
			this.$store.dispatch('files/update', {
				id: file.getId(),
				fields: {
					image: false,
				},
			});
		},
		insertText(text: string)
		{
			EventEmitter.emit(EventType.textarea.insertText, {
				text,
				dialogId: this.dialogId,
				replace: true,
			});
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		initResizeManager()
		{
			this.resizeManager = new ResizeManager({
				direction: ResizeDirection.down,
				minHeight: TextareaHeight.min,
				maxHeight: TextareaHeight.max,
			});
			this.resizeManager.subscribe(ResizeManager.events.onHeightChange, ({ data: { newHeight } }) => {
				this.textareaHeight = newHeight;
			});
			this.resizeManager.subscribe(ResizeManager.events.onResizeStop, () => {
				this.resizedTextareaHeight = this.textareaHeight;
			});
		},
		onResizeStart(event)
		{
			this.resizeManager.onResizeStart(event, this.textareaHeight);
		},
		doesContentOverflowScreen(newMaxPoint: number): boolean
		{
			const textareaTop = this.$refs.messageText.getBoundingClientRect().top;

			return textareaTop + newMaxPoint + BUTTONS_CONTAINER_HEIGHT > window.innerHeight;
		},
		getUploaderIdByFileId(fileId: string): ?string
		{
			const uploadingService: UploadingService = this.getUploadingService();

			return this.uploaderIds.find((uploaderId: string) => {
				return uploadingService.getFiles(uploaderId).some((file: UploaderFile) => {
					return file.getId() === fileId;
				});
			});
		},
		removeFileFromUploader(fileId: string)
		{
			const uploaderId: string = this.getUploaderIdByFileId(fileId);

			this.getUploadingService().removeFileFromUploader({
				uploaderId,
				filesIds: [fileId],
			});
		},
		onRemoveItem(event: { file: ImModelFile })
		{
			this.removeFileFromUploader(event.file.id);

			this.chunks = [];
			this.uploaderFiles = [];

			this.uploaderIds.forEach((uploaderId: string) => {
				const files = [];
				this.getUploadingService().getFiles(uploaderId).forEach((file) => {
					this.uploaderFiles.push(file);

					files.push(this.$store.getters['files/get'](file.getId()));
				});

				if (Type.isArrayFilled(files))
				{
					this.chunks.push(files);
				}
			});

			if (!Type.isArrayFilled(this.uploaderFiles))
			{
				this.onCancel();
			}
		},
	},
	template: `
		<div class="bx-im-upload-preview__container">
			<div class="bx-im-upload-preview__items-container">
				<div v-if="isMediaOnly && !sendAsFile" v-for="chunk in chunks" class="bx-im-upload-preview__items-chunk">
					<MediaGallery
						:files="chunk"
						:allowRemoveItem="true"
						@removeItem="onRemoveItem"
					/>
				</div>
				<div v-else v-for="chunk in chunks" class="bx-im-upload-preview__items-chunk">
					<FileItem
						v-for="fileItem in chunk"
						:file="fileItem"
						:removable="true"
						@removeItem="onRemoveItem"
					/>
				</div>
			</div>
			<div class="bx-im-upload-preview__controls-container">
				<div v-if="isOverMaxFilesLimit" class="bx-im-upload-preview__controls-files-limit-message">
					<span>{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILES_LIMIT_MESSAGE_100') }}</span>
				</div>
				<label v-if="isMediaOnly" class="bx-im-upload-preview__control-compress-image">
					<input type="checkbox" class="bx-im-upload-preview__control-compress-image-checkbox" v-model="sendAsFile">
					{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_SEND_WITHOUT_COMPRESSION') }}
				</label>
				<div class="bx-im-upload-preview__control-form">
					<textarea
						ref="messageText"
						v-model="text"
						:placeholder="loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_INPUT_PLACEHOLDER_2')"
						:maxlength="inputMaxLength"
						:style="{'height': textareaHeightStyle}"
						class="bx-im-upload-preview__message-text"
						rows="1"
						@keydown="onKeyDownHandler"
					></textarea>
					<SendButton :dialogId="dialogId" @click="onSend" />
				</div>
				<div @mousedown="onResizeStart" class="bx-im-upload-preview__drag-handle"></div>
			</div>
		</div>
	`,
};
