import { defineComponent, type PropType } from 'ui.vue3';

import { type AudioBlockType } from 'im.v2.const';
import { type ImModelFile } from 'im.v2.model';

import { AudioItem } from '../../../message-item/audio/audio';
import { BaseBlock } from '../base/base';

import './audio.css';

// @vue/component
export const AudioBlock = defineComponent({
	name: 'AudioBlock',
	components: { BaseBlock, AudioItem },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object as PropType<AudioBlockType>,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		audioBlock(): AudioBlockType
		{
			return this.block;
		},
		file(): ImModelFile | null
		{
			return this.$store.getters['files/get'](this.audioBlock.fileId);
		},
	},
	template: `
		<BaseBlock
			v-if="file"
			:message="message"
			:block="audioBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-audio__container" data-testid="im-message-block-audio">
				<AudioItem
					:item="file"
					:messageId="message.id"
					:withTranscription="false"
					data-testid="im-message-block-audio-item"
				/>
			</div>
		</BaseBlock>
	`,
});
