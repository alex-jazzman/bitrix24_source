// @vue/component
export const PlayerControlButton = {
	name: 'PlayerControlButton',
	props: {
		isPlaying: {
			type: Boolean,
			default: false,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	template: `
		<button
			class="bx-im-audio-player__control-button"
			:class="{
				'bx-im-audio-player__control-loader': isLoading,
				'bx-im-audio-player__control-play': !isLoading && !isPlaying,
				'bx-im-audio-player__control-pause': !isLoading && isPlaying,
			}"
			data-testid="im-audio-player-play"
			@click="$emit('click')"
		></button>
	`,
};
