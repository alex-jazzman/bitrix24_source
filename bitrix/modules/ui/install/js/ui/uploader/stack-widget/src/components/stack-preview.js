import { Loc } from 'main.core';
import { FileStatus } from 'ui.uploader.core';
import { FileIcon } from 'ui.uploader.tile-widget';

import { StackWidgetSize } from '../stack-widget-size';

const fileIconSizes = {
	[StackWidgetSize.LARGE]: 36,
	[StackWidgetSize.MEDIUM]: 27,
	[StackWidgetSize.SMALL]: 19,
	[StackWidgetSize.TINY]: 15,
}

export const StackPreview = {
	name: 'StackPreview',
	inject: ['widgetOptions'],
	components: {
		FileIcon,
	},
	props: {
		items: {
			type: Array,
			required: true,
		},
		isPopupShown: {
			type: Boolean,
			default: false,
		},
		// id of the hidden error text of the widget, null while there is no error
		errorId: {
			type: String,
			default: null,
		},
	},
	emits: ['showPopup'],
	computed: {
		FileStatus: () => FileStatus,
		Sizes: () => StackWidgetSize,
		item()
		{
			const item = this.items.find(item => {
				return item.status !== FileStatus.LOAD_FAILED && item.status !== FileStatus.UPLOAD_FAILED;
			});

			// nothing whole is left: the stack shows itself through its first file, broken as it is
			return item ?? this.items[0] ?? {};
		},
		// the name of the stack does not depend on the size: the file name is visible in LARGE and
		// MEDIUM only, and the counter is drawn over the preview in the small sizes
		stackLabel(): string
		{
			if (this.items.length > 1)
			{
				return Loc.getMessage('STACK_WIDGET_STACK_LABEL_MANY', { '#COUNT#': this.items.length });
			}

			return Loc.getMessage('STACK_WIDGET_STACK_LABEL_ONE', { '#FILENAME#': this.item.name });
		},
		fileIconSize()
		{
			return fileIconSizes[this.widgetOptions.size];
		},
		errorsCount()
		{
			return this.items.reduce((errors, item) => {
				if (item.status === FileStatus.LOAD_FAILED || item.status === FileStatus.UPLOAD_FAILED)
				{
					return errors + 1;
				}
				else
				{
					return errors;
				}
			}, 0);
		},
	},
	// language=Vue
	template: `
		<!-- explicit tabindex: see StackDropArea (Safari Tab order) -->
		<button
			type="button"
			class="ui-uploader-stack-preview"
			data-testid="ui-uploader-stack-preview-btn"
			tabindex="0"
			:class="{'--image': item.isImage}"
			:aria-label="stackLabel"
			aria-haspopup="dialog"
			:aria-expanded="isPopupShown ? 'true' : 'false'"
			:aria-describedby="errorId"
			@click="$emit('showPopup')"
		>
			<div class="ui-uploader-stack-preview-box">
				<template v-if="item.failed">
					<div class="ui-uploader-stack-preview-error"></div>
				</template>
				<template v-else-if="item.previewUrl">
					<div
						class="ui-uploader-stack-preview-image"
						:class="{ '--default': item.previewUrl === null }"
						:style="{ backgroundImage: item.previewUrl !== null ? 'url(' + item.previewUrl + ')' : '' }">
					</div>
					<div v-if="items.length > 1" class="ui-uploader-stack-preview-stats">
						<span class="ui-uploader-stack-preview-total">{{ items.length }}</span>
					</div>
				</template>
				<template v-else>
					<template v-if="item.name && item.status !== FileStatus.LOADING">
						<div class="ui-uploader-stack-preview-file-icon">
							<FileIcon :name="item.extension" :size="fileIconSize" aria-hidden="true"/>
						</div>
						<div
							v-if="[Sizes.LARGE, Sizes.MEDIUM].includes(widgetOptions.size)"
							:title="item.name"
							class="ui-uploader-stack-preview-file-name"
						>{{
							items.length > 1
							? this.$Bitrix.Loc.getMessage('STACK_WIDGET_FILE_COUNT', { '#count#': items.length })
							: item.name
						}}</div>
						<div 
							v-if="items.length > 1 && [Sizes.SMALL, Sizes.TINY].includes(widgetOptions.size)"
							class="ui-uploader-stack-preview-stats">
							<span class="ui-uploader-stack-preview-total">{{ items.length }}</span>
						</div>
					</template>
					<template v-else>
						<div class="ui-uploader-stack-preview-file-default"></div>
					</template>
				</template>
			</div>
			<!-- the icon only repeats what the button already does, so it stays out of the tree -->
			<div
				class="ui-uploader-stack-upload-menu"
				aria-hidden="true"
				:title="$Bitrix.Loc.getMessage('STACK_WIDGET_OPEN_FILE_GALLERY')"
			></div>
		</button>
	`,
};
