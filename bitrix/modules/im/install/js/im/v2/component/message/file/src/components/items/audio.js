import { AudioPlayer } from 'im.v2.component.elements.audioplayer';
import { ProgressBar, ProgressBarSize } from 'im.v2.component.elements.progressbar';

import '../../css/items/audio.css';

import type { ImModelFile } from 'im.v2.model';

// @vue/component
export const AudioItem = {
	name: 'AudioItem',
	components: { AudioPlayer, ProgressBar },
	props: {
		item: {
			type: Object,
			required: true,
		},
		messageType: {
			type: String,
			required: true,
		},
		messageId: {
			type: [String, Number],
			required: true,
		},
	},
	emits: ['cancelClick'],
	computed: {
		ProgressBarSize: () => ProgressBarSize,
		file(): ImModelFile
		{
			return this.item;
		},
	},
	methods: {
		onCancelClick(event)
		{
			this.$emit('onCancel', event);
		},
	},
	template: `
		<div class="bx-im-media-audio__container">
			<ProgressBar 
				:item="file"
				:size="ProgressBarSize.S"
				@cancelClick="onCancelClick"
			/>
			<AudioPlayer
				:id="file.id"
				:messageId="messageId"
				:src="file.urlDownload"
				:file="file"
				:timelineType="Math.floor(Math.random() * 5)"
				:authorId="file.authorId"
				:withContextMenu="false"
				:withAvatar="false"
			/>
		</div>
	`,
};
