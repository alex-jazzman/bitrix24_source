import { defineComponent, type PropType } from 'ui.vue3';

import { AudioPlayer } from 'im.v2.component.elements.player';
import { ProgressBar, ProgressBarSize } from 'im.v2.component.elements.progressbar';
import { type ImModelFile } from 'im.v2.model';

import './audio.css';

// @vue/component
export const AudioItem = defineComponent({
	name: 'AudioItem',
	components: { AudioPlayer, ProgressBar } as { AudioPlayer: typeof AudioPlayer, ProgressBar: typeof ProgressBar },
	props: {
		item: {
			type: Object as PropType<ImModelFile>,
			required: true,
		},
		messageId: {
			type: [String, Number],
			required: true,
		},
		withTranscription: {
			type: Boolean,
			default: true,
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
		onCancelClick(event: PointerEvent): void
		{
			this.$emit('cancelClick', event);
		},
	},
	template: `
		<div class="bx-im-media-audio__container" data-testid="im-message-audio">
			<ProgressBar 
				:item="file"
				:size="ProgressBarSize.S"
				@cancelClick="onCancelClick"
			/>
			<AudioPlayer
				:messageId="messageId"
				:src="file.urlDownload"
				:file="file"
				:authorId="file.authorId"
				:withContextMenu="false"
				:withAvatar="false"
				:withTranscription="withTranscription"
				withPlaybackRateControl
			/>
		</div>
	`,
});
