import { Loc, Type } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';

import { PromoId, type FileBlockType } from 'im.v2.const';
import { showDownloadAllFilesConfirm } from 'im.v2.lib.confirm';
import { BaseFileContextMenu } from 'im.v2.lib.menu';
import { PromoManager } from 'im.v2.lib.promo';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelFile } from 'im.v2.model';

import { BaseFileItem } from '../../../message-item/base-file/base-file';
import { BaseBlock } from '../base/base';

import './file.css';

// @vue/component
export const FileBlock = defineComponent({
	name: 'FileBlock',
	components: { BaseBlock, BaseFileItem },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object as PropType<FileBlockType>,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	setup(): { contextMenu: BaseFileContextMenu | null }
	{
		return {
			contextMenu: null,
		};
	},
	computed: {
		fileBlock(): FileBlockType
		{
			return this.block;
		},
		// The model does not guarantee `fileIds`, and a block without it must not take the render
		// of the whole message down: no field means the same as an empty set. Same guard as the
		// file list of the message menu (im.v2.lib.menu, message-base.js).
		files(): ImModelFile[]
		{
			const fileIds = Type.isArrayFilled(this.fileBlock.fileIds) ? this.fileBlock.fileIds : [];

			return fileIds
				.map((fileId) => {
					return this.$store.getters['files/get'](fileId);
				})
				.filter((file): boolean => {
					return file !== null;
				});
		},
		hasFiles(): boolean
		{
			return this.files.length > 0;
		},
		// A single tile already carries its own download icon, so the layout offers the link
		// only for a multi-file block. The label is also the whole size of the link, so without
		// a phrase the link is dropped instead of rendering as an invisible focusable element.
		hasDownloadAllLink(): boolean
		{
			return this.files.length > 1 && this.downloadAllText !== '';
		},
		downloadAllText(): string
		{
			const totalSize = this.files.reduce((size, file) => size + file.size, 0);

			return Loc.getMessagePlural('IM_MESSAGE_BUILDER_FILE_DOWNLOAD_ALL', this.files.length, {
				'#COUNT#': String(this.files.length),
				'#SIZE#': Utils.file.formatFileSize(totalSize),
			}) ?? '';
		},
	},
	created(): void
	{
		this.contextMenu = new BaseFileContextMenu();
	},
	beforeUnmount(): void
	{
		this.contextMenu?.destroy();
	},
	methods: {
		// Same menu as the tile of a plain file message. The context carries the clicked file
		// alone: the save-to-disk item takes `context.files`, while `message.files` holds the
		// attachments of the message, which are not the files of this block.
		onOpenContextMenu({ event, fileId }: { event: PointerEvent, fileId: number }): void
		{
			const file = this.files.find((item) => item.id === fileId);
			if (!file)
			{
				return;
			}

			const context = { dialogId: this.dialogId, fileId, files: [fileId] };
			this.contextMenu?.openMenu(context, event.target as HTMLElement);
		},
		// Downloads the files of this block only. Same path and same promo as the message
		// context menu item, so the Chrome warning is shown to the user once for both.
		async onDownloadAllClick(): Promise<void>
		{
			Utils.file.downloadFiles(this.files);

			const promoManager = PromoManager.getInstance();
			const needToShowPopup = promoManager.needToShow(PromoId.downloadSeveralFiles);
			if (!needToShowPopup || !Utils.browser.isChrome() || Utils.platform.isBitrixDesktop())
			{
				return;
			}

			await showDownloadAllFilesConfirm();
			void promoManager.markAsWatched(PromoId.downloadSeveralFiles);
		},
	},
	template: `
		<BaseBlock
			v-if="hasFiles"
			:message="message"
			:block="fileBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-file__container" data-testid="im-message-block-file">
				<BaseFileItem
					v-for="file in files"
					:key="file.id"
					:id="file.id"
					:messageId="message.id"
					data-testid="im-message-block-file-item"
					@openContextMenu="onOpenContextMenu"
				/>
				<template v-if="hasDownloadAllLink">
					<div class="bx-im-message-block-file__divider"></div>
					<button
						type="button"
						class="bx-im-message-block-file__download-all"
						data-testid="im-message-block-file-download-all"
						@click="onDownloadAllClick"
					>{{ downloadAllText }}</button>
				</template>
			</div>
		</BaseBlock>
	`,
});
