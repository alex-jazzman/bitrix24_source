import { Outline } from 'ui.icon-set.api.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Color, FileStatus, FileViewerContext } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { IconButton } from 'im.v2.component.elements.icon-button';

import { FilePreviewItem } from './items/file';

import '../../css/upload-preview/file-item.css';

// @vue/component
export const FileItem = {
	name: 'FileItem',
	components: { FilePreviewItem, IconButton, BIcon },
	props: {
		file: {
			type: Object,
			required: true,
		},
		// the window of an edit draws its rows by the mockup of the feature; a send keeps its own look
		isEditMode: {
			type: Boolean,
			default: false,
		},
		removable: {
			type: Boolean,
			default: false,
		},
		// the batch is on its way to the server, and the row says how far its own file has got
		handleLoading: {
			type: Boolean,
			default: false,
		},
		highlightDropzone: {
			type: Object,
			default: null,
		},
		viewerGroupBy: {
			type: String || null,
			default: null,
		},
		// id of the shared hint telling that Delete removes the focused file
		describedById: {
			type: String,
			default: null,
		},
	},
	emits: [
		'removeItem',
		'retryItem',
		'itemDragStart',
		'itemDragEnd',
		'itemDragOver',
		'itemDragLeave',
		'itemDrop',
	],
	data()
	{
		return {
			isDraggable: false,
		};
	},
	computed: {
		removeIconName: () => Outline.CROSS_L,
		removeIconColor: () => Color.gray90,
		removeButtonLabel(): string
		{
			return this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_REMOVE_FILE_ARIA', { '#FILE_NAME#': this.file.name });
		},
		hasError(): boolean
		{
			return this.file.status === FileStatus.error;
		},
		hasValidationError(): boolean
		{
			return Boolean(this.file.validationError);
		},
		// the icon says nothing on its own, and rows of one batch differ only by the file they hold
		removeLabel(): string
		{
			return this.$Bitrix.Loc.getMessage(
				'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_REMOVE_ARIA',
				{ '#FILE_NAME#': this.file.name },
			);
		},
		OutlineIcons: () => OutlineIcons,
		// the row of a failed file keeps its name and says what became of it where the size used to be;
		// the weight follows the reason in its own colour, so the row renders the two apart
		errorStatusText(): string
		{
			if (!this.hasError)
			{
				return '';
			}

			return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_NOT_UPLOADED');
		},
		retryLabel(): string
		{
			return this.$Bitrix.Loc.getMessage(
				'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_RETRY_ARIA',
				{ '#FILE_NAME#': this.file.name },
			);
		},
		draggableClasses(): { [key: string]: boolean }
		{
			const classes = {};

			if (this.highlightDropzone.fileId === this.file.id)
			{
				classes[`--dropzone-${this.highlightDropzone.position}`] = true;
			}

			classes['--draggable'] = this.isDraggable;

			return classes;
		},
		viewerAttributes(): Object
		{
			// a file that failed to upload has nothing to show, and the viewer listens for clicks on the
			// document in the capture phase: its handler would run before anything inside the row could stop
			// the event, so the retry of that very row would open the viewer instead of repeating the upload
			if (this.hasError)
			{
				return {};
			}

			if (this.file.viewerAttrs)
			{
				return Utils.file.getViewerDataAttributes({
					viewerAttributes: this.file.viewerAttrs,
					previewImageSrc: this.file.urlPreview,
					context: FileViewerContext.dialog,
				});
			}

			return Utils.file.getViewerDataAttributes({
				viewerAttributes: {
					viewer: true,
					viewerResized: true,
					viewerType: this.file.type,
					title: this.file.name,
					src: this.file.urlDownload,
					viewerGroupBy: this.viewerGroupBy,
				},
				previewImageSrc: this.file.urlPreview,
				context: FileViewerContext.dialog,
			});
		},
	},
	methods: {
		onRemoveClick()
		{
			this.$emit('removeItem', { file: this.file });
		},
		onRetryClick()
		{
			this.$emit('retryItem', { file: this.file });
		},
		onDragStart(event)
		{
			this.$emit('itemDragStart', { file: this.file, axis: 'y', event });

			this.isDraggable = true;
		},
		onDragEnd(event)
		{
			this.$emit('itemDragEnd', { file: this.file, axis: 'y', event });

			this.isDraggable = false;
			event.target.removeAttribute('draggable');
		},
		onDragOver(event)
		{
			this.$emit('itemDragOver', { file: this.file, axis: 'y', event });
		},
		onDragLeave(event)
		{
			this.$emit('itemDragLeave', { file: this.file, axis: 'y', event });
		},
		onDrop(event)
		{
			this.$emit('itemDrop', { file: this.file, axis: 'y', event });

			this.isDraggable = false;
		},
		onMouseDown()
		{
			this.$refs.dragElement.setAttribute('draggable', 'true');
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div
			class="bx-im-upload-preview-file-item__scope"
			:class="[this.draggableClasses, { '--has-validation-error': hasValidationError, '--has-upload-error': hasError }]"
			role="gridcell"
			:aria-label="file.name"
			aria-keyshortcuts="Delete"
			:aria-describedby="describedById"
			:data-testid="'im-upload-preview-file-item-' + file.id"
			:data-id="file.id"
			tabindex="-1"
			@dragstart="onDragStart"
			@dragend="onDragEnd"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
			ref="dragElement"
		>
			<div
				class="bx-im-upload-preview-file-item__drag"
				data-testid="im-upload-preview-file-drag-handle"
				aria-hidden="true"
				@mousedown="onMouseDown"
			>
				<div class="bx-im-upload-preview-file-item__drag-icon"></div>
			</div>
			<FilePreviewItem
				:file="file"
				:isEditMode="isEditMode"
				:handleLoading="handleLoading && !hasError"
				:statusText="errorStatusText"
				v-bind="viewerAttributes"
			/>
			<button
				v-if="hasError"
				type="button"
				class="bx-im-upload-preview-file-item__retry"
				data-testid="im-upload-preview-file-retry-btn"
				:aria-label="retryLabel"
				tabindex="-1"
				@click="onRetryClick"
			>
				<BIcon :name="OutlineIcons.REFRESH" />
			</button>
			<IconButton
				v-if="removable || hasValidationError || hasError"
				class="bx-im-upload-preview-file-item__remove"
				data-testid="im-upload-preview-file-item-remove-btn"
				:iconName="removeIconName"
				:iconColor="removeIconColor"
				:label="removeButtonLabel"
				:tabindex="-1"
				@click="onRemoveClick"
			/>
		</div>
	`,
};
