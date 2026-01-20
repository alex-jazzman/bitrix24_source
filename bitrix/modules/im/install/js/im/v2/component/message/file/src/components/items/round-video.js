import { ProgressBar } from 'im.v2.component.elements.progressbar';
import { RoundVideoPlayer } from 'im.v2.component.elements.videoplayer';

import '../../css/items/round-video.css';

import type { ImModelFile } from 'im.v2.model';

// @vue/component
export const RoundVideo = {
	name: 'RoundVideo',
	components: { ProgressBar, RoundVideoPlayer },
	props: {
		fileId: {
			type: [String, Number],
			required: true,
		},
	},
	emits: ['cancelClick'],
	computed: {
		file(): ImModelFile
		{
			return this.$store.getters['files/get'](this.fileId, true);
		},
	},
	template: `
		<div class="bx-im-round-video-item__container">
			<ProgressBar 
				:item="file"
				@cancelClick="$emit('cancelClick')"
			/>
			<RoundVideoPlayer :item="file"/>
		</div>
	`,
};
