import { defineComponent } from 'ui.vue3';

import { CallIcon } from 'call.component.ui.icon';

import './css/voice-indicator.css';

const MAX_BARS = 20;
const ANIMATION_SMOOTHING_FACTOR = 0.2;
const ANIMATION_THRESHOLD = 0.001;

export const CallVoiceIndicator = defineComponent({
	name: 'CallVoiceIndicator',
	components: {
		CallIcon,
	},
	props: {
		level: {
			type: Number,
			default: 0,
			validator: (v: number): boolean => v >= 0 && v <= 1,
		},
		isMuted: {
			type: Boolean,
			default: false,
		},
	},
	data(): { bars: Array<{ index: number }>; animatedLevel: number; animationFrame: number | null }
	{
		return {
			bars: Array.from({ length: MAX_BARS }, (_, i) => ({ index: i })),
			animatedLevel: 0,
			animationFrame: null,
		};
	},
	computed: {
		activeCount(): number
		{
			if (this.isMuted)
			{
				return 0;
			}

			return Math.floor(this.animatedLevel * MAX_BARS);
		},
	},
	watch: {
		level: {
			handler(): void
			{
				this.animateToLevel();
			},
			immediate: true,
		},
	},
	beforeUnmount(): void
	{
		if (this.animationFrame)
		{
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	},
	methods: {
		animateToLevel(): void
		{
			const animate = (): void =>
			{
				const diff = this.level - this.animatedLevel;

				if (Math.abs(diff) > ANIMATION_THRESHOLD)
				{
					this.animatedLevel += diff * ANIMATION_SMOOTHING_FACTOR;
					this.animationFrame = requestAnimationFrame(animate);
				}
				else
				{
					this.animatedLevel = this.level;
					this.animationFrame = null;
				}
			};

			if (this.animationFrame)
			{
				cancelAnimationFrame(this.animationFrame);
				this.animationFrame = null;
			}

			animate();
		},
	},
	template: /* HTML */`
		<div class="call-voice-indicator">
			<CallIcon
				:icon="isMuted ? 'microphone-off' : 'microphone'"
				size="xs"
				class="call-voice-indicator__icon"
				:color="isMuted ? 'red' : null"
			/>
			<div class="call-voice-indicator__content">
				<div
					v-for="bar in bars"
					:key="bar.index"
					class="call-voice-indicator__item"
					:class="{ '--active': bar.index < activeCount }"
				/>
			</div>
		</div>
	`,
});
