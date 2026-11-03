import { TextSm, TextXs } from 'ui.system.typography.vue';

// @vue/component
export const TrackInfo = {
	name: 'PlayerBarTrackInfo',
	components: { TextSm, TextXs },
	props: {
		authorName: {
			type: String,
			default: '',
		},
		chatTitle: {
			type: String,
			default: '',
		},
	},
	template: `
		<div class="bx-im-player-bar__track-info" data-testid="im-player-bar-track-info">
			<TextSm
				class="bx-im-player-bar__track-info_author"
				wrap="truncate"
				data-testid="im-player-bar-author"
			>
				{{ authorName }}
			</TextSm>
			<TextXs
				v-if="chatTitle"
				class="bx-im-player-bar__track-info_chat"
				wrap="truncate"
				data-testid="im-player-bar-chat"
			>
				{{ chatTitle }}
			</TextXs>
		</div>
	`,
};
