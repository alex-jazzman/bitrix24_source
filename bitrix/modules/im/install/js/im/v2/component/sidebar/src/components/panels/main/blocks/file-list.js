import { SidebarDetailBlock, EventType } from 'im.v2.const';

import { FilePreviewItem } from '../../file/components/file-preview-item';
import { DetailEmptyState } from '../../../elements/detail-empty-state/detail-empty-state';

import '../css/file.css';

import type { EventEmitter } from 'main.core.events';
import type { ImModelChat, ImModelSidebarFileItem } from 'im.v2.model';

// @vue/component
export const FileListPreview = {
	name: 'FileListPreview',
	components: { DetailEmptyState, FilePreviewItem },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		SidebarDetailBlock: () => SidebarDetailBlock,
		files(): ImModelSidebarFileItem[]
		{
			if (this.isMigrationFinished)
			{
				return this.$store.getters['sidebar/files/getLatest'](this.chatId);
			}

			return this.$store.getters['sidebar/files/getLatestUnsorted'](this.chatId);
		},
		hasFiles(): boolean
		{
			return this.files.length > 0;
		},
		// The preview of the block leaves some of the files of the chat out - a video note has no
		// rectangular preview to draw - so an empty preview is not an empty chat, and the panel behind
		// the block has to stay reachable either way.
		hasAnyFiles(): boolean
		{
			return this.$store.getters['sidebar/files/hasAnyFiles'](this.chatId);
		},
		isMigrationFinished(): boolean
		{
			return this.$store.state.sidebar.isFilesMigrated;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
	},
	methods:
	{
		onOpenDetail()
		{
			if (!this.hasAnyFiles)
			{
				return;
			}

			const panel = this.isMigrationFinished ? SidebarDetailBlock.file : SidebarDetailBlock.fileUnsorted;

			this.getEmitter().emit(EventType.sidebar.open, {
				panel,
				dialogId: this.dialogId,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div class="bx-im-sidebar-file-preview__scope" data-testid="im-sidebar-file-list">
			<div class="bx-im-sidebar-file-preview__container">
				<div
					class="bx-im-sidebar-file-preview__header_container"
					:class="[hasAnyFiles ? '--active': '']"
					data-testid="im-sidebar-file-list-header"
					@click="onOpenDetail"
				>
					<span class="bx-im-sidebar-file-preview__title-text">
						{{ $Bitrix.Loc.getMessage('IM_SIDEBAR_MEDIA_DETAIL_TITLE') }}
					</span>
					<div
						v-if="hasAnyFiles"
						class="bx-im-sidebar__forward-icon"
						data-testid="im-sidebar-file-list-forward-icon"
					></div>
				</div>
				<div v-if="hasFiles" class="bx-im-sidebar-file-preview__files-container">
					<FilePreviewItem v-for="file in files" :fileItem="file" />
				</div>
				<DetailEmptyState
					v-else-if="!hasAnyFiles"
					:title="$Bitrix.Loc.getMessage('IM_SIDEBAR_MEDIA_AND_FILES_EMPTY')"
					:iconType="SidebarDetailBlock.media"
				/>
			</div>
		</div>
	`,
};
