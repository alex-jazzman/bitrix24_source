const PLAYER_RADIUS = 130;
const PLAYER_DIAMETER = PLAYER_RADIUS * 2;
const PLAYER_PROGRESS_MARGIN = 1;

// @vue/component
export const RoundProgressBar = {
	name: 'RoundProgressBar',
	props: {
		progress: {
			type: Number,
			required: true,
			validator: (value) => value >= 0 && value <= 100,
		},
	},
	computed: {
		PLAYER_RADIUS: () => PLAYER_RADIUS,
		PLAYER_DIAMETER: () => PLAYER_DIAMETER,
		PLAYER_PROGRESS_MARGIN: () => PLAYER_PROGRESS_MARGIN,
		progressStyles(): { strokeDashoffset: number, strokeDasharray: number }
		{
			const radius = PLAYER_RADIUS - PLAYER_PROGRESS_MARGIN;
			const circumference = 2 * Math.PI * radius;

			const offset = circumference - (this.progress / 100) * circumference;

			return {
				strokeDasharray: circumference,
				strokeDashoffset: offset,
			};
		},
	},
	template: `
		<div class="bx-im-round-video-player__progress-container">
			<svg :viewBox="\`0 0 ${PLAYER_DIAMETER} ${PLAYER_DIAMETER}\`">
				<circle
					:style="progressStyles"
					class="bx-im-round-video-player__progress"
					:transform="\`rotate(-90, ${PLAYER_RADIUS}, ${PLAYER_RADIUS})\`"
					:cx="PLAYER_RADIUS"
					:cy="PLAYER_RADIUS"
					:r="PLAYER_RADIUS - PLAYER_PROGRESS_MARGIN"
				></circle>
			</svg>
		</div>
	`,
};
