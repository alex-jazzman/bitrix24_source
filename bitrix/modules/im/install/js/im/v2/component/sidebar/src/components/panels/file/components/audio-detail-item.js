import { type ImModelSidebarFileItem, type ImModelFile } from 'im.v2.model';
import { PlaylistScope } from 'im.v2.const';
import { AudioPlayer } from 'im.v2.component.elements.player';

import '../css/audio-detail-item.css';

// @vue/component
export const AudioDetailItem = {
	name: 'AudioDetailItem',
	components: { AudioPlayer },
	props: {
		fileItem: {
			type: Object,
			required: true,
		},
	},
	emits: ['contextMenuClick'],
	computed: {
		PlaylistScope: () => PlaylistScope,
		sidebarFileItem(): ImModelSidebarFileItem
		{
			return this.fileItem;
		},
		file(): ImModelFile
		{
			return this.$store.getters['files/get'](this.sidebarFileItem.fileId, true);
		},
		audioUrl(): string
		{
			return this.file.urlDownload;
		},
	},
	methods: {
		onContextMenuClick(event)
		{
			this.$emit('contextMenuClick', {
				sidebarFile: this.sidebarFileItem,
				file: this.file,
				messageId: this.sidebarFileItem.messageId,
			}, event.currentTarget);
		},
	},
	template: `
		<div class="bx-im-sidebar-file-audio-detail-item__container bx-im-sidebar-file-audio-detail-item__scope">
			<AudioPlayer
				:src="audioUrl"
				:file="file"
				:messageId="sidebarFileItem.messageId"
				:authorId="sidebarFileItem.authorId"
				:withPlaybackRateControl="true"
				:withTranscription="false"
				:playlistScope="PlaylistScope.sidebar"
				@contextMenuClick="onContextMenuClick"
			/>
		</div>
	`,
};
