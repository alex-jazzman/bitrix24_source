import { Loc, Type, Text, Runtime } from 'main.core';

import { FileIcon } from 'ui.uploader.tile-widget';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import type { BitrixVueComponentProps } from 'ui.vue3';
import type { UploaderFileInfo } from 'ui.uploader.core';
import { FileStatus } from 'ui.uploader.core';

import 'ui.icon-set.outline';
import './css/file-list.css';

const MAX_FILENAME_LENGTH = 60;
const CROP_FILENAME_END_LENGTH = 5;
const FILE_ICON_SIZE = 24;

// @vue/component
export const FileListItem: BitrixVueComponentProps = {
	name: 'DiskUserFieldFileListItem',
	components: {
		FileIcon,
		BIcon,
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		groupBy: {
			type: String,
			default: null,
		},
		showMenuButton: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['menuClick'],
	setup(): Object
	{
		return {
			Outline,
			FILE_ICON_SIZE,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		file(): UploaderFileInfo
		{
			return this.item;
		},
		formattedFileName(): string
		{
			const fileName = this.fileNameWithoutExtension;
			if (fileName.length <= MAX_FILENAME_LENGTH)
			{
				return fileName;
			}

			const start = fileName.slice(0, MAX_FILENAME_LENGTH - CROP_FILENAME_END_LENGTH - 1);
			const end = fileName.slice(-1 * CROP_FILENAME_END_LENGTH);

			return `${start}...${end}`;
		},
		fileNameWithoutExtension(): string
		{
			if (!this.file.extension)
			{
				return this.file.name;
			}

			const start = 0;
			const end = this.file.name.length - this.file.extension.length - 1;

			return this.file.name.slice(start, end);
		},
		formattedExtension(): string
		{
			return this.file.extension ? `.${this.file.extension}` : '';
		},
		sizeFormatted(): string
		{
			return this.file.sizeFormatted || '';
		},
		isComplete(): boolean
		{
			return this.file.status === FileStatus.COMPLETE;
		},
		canOpen(): boolean
		{
			return this.isComplete && Type.isPlainObject(this.file.viewerAttrs);
		},
		// Mirrors ui.uploader.tile-widget TileItem.viewerAttrs so a list row opens through the
		// same global ui.viewer delegation and the same gallery grouping as a tile.
		viewerAttrs(): Object
		{
			const { viewerAttrs, previewUrl } = this.file;

			if (!Type.isPlainObject(viewerAttrs))
			{
				return {};
			}

			const params = {};
			for (const [key, value] of Object.entries(viewerAttrs))
			{
				params[`data-${Text.toKebabCase(key)}`] = value;
			}

			params['data-viewer'] = true;

			if (Type.isStringFilled(previewUrl))
			{
				params['data-viewer-preview'] = previewUrl;
			}

			if (this.groupBy && Type.isUndefined(viewerAttrs.viewerSeparateItem))
			{
				params['data-viewer-group-by'] = this.groupBy;
			}

			return params;
		},
	},
	methods: {
		getMessage(code: string, replacements?: Object<string, string>): ?string
		{
			return Loc.getMessage(code, replacements);
		},
		// Mouse clicks open through the global ui.viewer delegation (the data-viewer node);
		// this handler is only for keyboard activation and opens the very same in-DOM node,
		// so the gallery grouping is identical to a mouse click and to the tile view.
		handleOpenClick(event: Event): void
		{
			if (!this.canOpen)
			{
				return;
			}

			const node: HTMLElement = event.currentTarget;
			Runtime.loadExtension('ui.viewer').then((): void => {
				BX.UI.Viewer.Instance.openByNode(node);
			});
		},
		handleMenuClick(): void
		{
			// Track the open state reactively so :aria-expanded survives a rerender;
			// the parent drives it back via these callbacks when the menu opens/closes.
			this.$emit('menuClick', {
				item: this.item,
				bindElement: this.$refs.menuButton?.$el,
				onMenuShow: (): void => {
					this.isMenuShown = true;
				},
				onMenuClose: (): void => {
					this.isMenuShown = false;
				},
			});
		},
	},
	template: `
		<div class="disk-user-field-file-list-item" data-testid="disk-file-list-item">
			<div
				class="disk-user-field-file-list-item-openable"
				:class="{ '--clickable': canOpen }"
				v-bind="canOpen ? viewerAttrs : {}"
				:role="canOpen ? 'button' : null"
				:tabindex="canOpen ? 0 : null"
				@keydown.enter.prevent="handleOpenClick"
				@keydown.space.prevent="handleOpenClick"
			>
				<div class="disk-user-field-file-list-item-preview-container">
					<div v-if="file.isImage && file.previewUrl" class="disk-user-field-file-list-item-preview --image">
						<img class="disk-user-field-file-list-item-image" :src="file.previewUrl" alt="">
					</div>
					<FileIcon
						v-else
						class="disk-user-field-file-list-item-preview --icon"
						:name="file.extension || '...'"
						:size="FILE_ICON_SIZE"
					/>
				</div>
				<div class="disk-user-field-file-list-item-info">
					<div class="disk-user-field-file-list-item-filename-container" :title="file.name">
						<span class="disk-user-field-file-list-item-filename">{{ formattedFileName }}</span>
						<span class="disk-user-field-file-list-item-extension">{{ formattedExtension }}</span>
					</div>
					<span v-if="sizeFormatted" class="disk-user-field-file-list-item-size">{{ sizeFormatted }}</span>
				</div>
			</div>
			<BIcon
				v-if="showMenuButton && isComplete"
				class="disk-user-field-file-list-item-menu"
				:name="Outline.MORE_M"
				:size="FILE_ICON_SIZE"
				hoverable
				tabindex="0"
				role="button"
				:aria-label="getMessage('DISK_UF_WIDGET_ITEM_MENU_ARIA_LABEL', { '#name#': file.name })"
				aria-haspopup="menu"
				:aria-expanded="isMenuShown ? 'true' : 'false'"
				data-testid="disk-file-list-item-menu-btn"
				@click="handleMenuClick"
				@keydown.enter.prevent="handleMenuClick"
				@keydown.space.prevent="handleMenuClick"
				ref="menuButton"
			/>
		</div>
	`,
};
