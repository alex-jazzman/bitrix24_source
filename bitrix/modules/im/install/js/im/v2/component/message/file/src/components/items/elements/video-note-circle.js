import { RoundVideoPlayer } from 'im.v2.component.elements.player';
import { ProgressBar } from 'im.v2.component.elements.progressbar';
// the type label of a video note lives in the lang file of the parser
import 'im.v2.lib.parser';
import { type ImModelFile, type ImModelMessage } from 'im.v2.model';

import '../../../css/items/elements/video-note-circle.css';

// @vue/component
export const VideoNoteCircle = {
	name: 'VideoNoteCircle',
	components: { ProgressBar, RoundVideoPlayer },
	props: {
		item: {
			/** @type ImModelMessage */
			type: Object,
			required: true,
		},
		fileId: {
			type: [String, Number],
			required: true,
		},
		startWithSound: {
			type: Boolean,
			default: false,
		},
		// The label came with the caption feature, so the views pass its availability down
		showTypeLabel: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['cancelClick', 'openTranscription'],
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		file(): ImModelFile
		{
			return this.$store.getters['files/get'](this.fileId, true);
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-video-note__container" data-testid="im-message-video-note-circle">
			<span v-if="showTypeLabel" class="bx-im-video-note__type-label">{{ loc('IM_PARSER_ICON_TYPE_VIDEO_NOTE') }}</span>
			<ProgressBar
				:item="file"
				@cancelClick="$emit('cancelClick')"
			/>
			<RoundVideoPlayer
				:item="file"
				:message="message"
				:startWithSound="startWithSound"
				@openTranscription="$emit('openTranscription')"
			/>
		</div>
	`,
};
