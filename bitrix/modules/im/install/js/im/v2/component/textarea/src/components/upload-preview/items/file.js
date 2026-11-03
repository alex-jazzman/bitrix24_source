import { Type } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Text2Xs } from 'ui.system.typography.vue';

import { Utils } from 'im.v2.lib.utils';
import { ProgressBar, ProgressBarSize } from 'im.v2.component.elements.progressbar';
import 'ui.icons';

// @vue/component
export const FilePreviewItem = {
	name: 'FilePreviewItem',
	components: { BIcon, ProgressBar, Text2Xs },
	inheritAttrs: false,
	props: {
		file: {
			type: Object,
			required: true,
		},
		// the mockup of the feature belongs to an edit: a send keeps the row it always had
		isEditMode: {
			type: Boolean,
			default: false,
		},
		maxNameLength: {
			type: Number,
			default: 25,
		},
		// the batch is on its way to the server, and the row says how far its own file has got
		handleLoading: {
			type: Boolean,
			default: false,
		},
		// takes the place of the size when the row has something to say about the file instead of its weight
		statusText: {
			type: String,
			default: '',
		},
	},
	setup(): Object
	{
		return { ProgressBarSize, OutlineIcons };
	},
	computed: {
		// a file that never arrived shows no format badge: its type says nothing about what happened
		fileIconClass(): string
		{
			const icon = this.hasFailedUpload ? 'empty' : this.file.icon;

			return `ui-icon ui-icon-file-${icon}`;
		},
		// the status takes the place of the size, and only a failed upload fills it
		hasStatus(): boolean
		{
			return Type.isStringFilled(this.statusText);
		},
		// what the mockup of the failed row changes is drawn in an edit and nowhere else
		hasFailedUpload(): boolean
		{
			return this.isEditMode && this.hasStatus;
		},
		fileShortName(): string
		{
			return Utils.file.getShortFileName(this.file.name, this.maxNameLength);
		},
		fileSize(): string
		{
			return Utils.file.formatFileSize(this.file.size);
		},
		// a file that never arrived has nothing to show: the mockup keeps the empty emblem on its row
		hasPreview(): boolean
		{
			return !this.hasFailedUpload && Type.isStringFilled(this.file.urlPreview);
		},
		imageStyles(): { backgroundImage: string }
		{
			return {
				backgroundImage: `url(${this.file.urlPreview})`,
			};
		},
		validationErrorText(): string
		{
			return this.file.validationError ?? '';
		},
	},
	template: `
		<div class="bx-im-upload-preview-file-item__content">
			<div class="bx-im-upload-preview-file-item__file-container" v-bind="$attrs">
				<div class="bx-im-upload-preview-file-item__icon">
					<div v-if="hasPreview" :style="imageStyles" class="bx-im-upload-preview-file-item__preview"></div>
					<div v-else :class="fileIconClass"><i></i></div>
					<ProgressBar
						v-if="handleLoading"
						:item="file"
						:size="ProgressBarSize.S"
						:allowCancel="false"
					/>
				</div>
				<div class="bx-im-upload-preview-file-item__info">
					<div class="bx-im-upload-preview-file-item__name">{{ fileShortName }}</div>
					<div
						v-if="hasStatus"
						class="bx-im-upload-preview-file-item__status"
						data-testid="im-upload-preview-file-status"
					>
						<template v-if="isEditMode">
							<BIcon
								:name="OutlineIcons.EXCLAMATION_CIRCLE"
								class="bx-im-upload-preview-file-item__status-icon"
							/>
							<Text2Xs className="bx-im-upload-preview-file-item__status-text">{{ statusText }}</Text2Xs>
							<Text2Xs className="bx-im-upload-preview-file-item__status-size">· {{ fileSize }}</Text2Xs>
						</template>
						<template v-else>{{ statusText }} · {{ fileSize }}</template>
					</div>
					<div v-else class="bx-im-upload-preview-file-item__size">{{ fileSize }}</div>
				</div>
			</div>
			<div v-if="validationErrorText" class="bx-im-upload-preview-file-item__validation-error">
				{{ validationErrorText }}
			</div>
		</div>
	`,
};
