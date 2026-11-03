// @vue/component
export const PlayerRateButton = {
	name: 'PlayerRateButton',
	props: {
		rate: {
			type: Number,
			required: true,
		},
		isHidden: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	template: `
		<div class="bx-im-audio-player__rate-button-container">
			<button
				:class="{'--hidden': isHidden}"
				data-testid="im-audio-player-rate"
				@click="$emit('click')"
			>
				{{ rate }}x
			</button>
		</div>
	`,
};
