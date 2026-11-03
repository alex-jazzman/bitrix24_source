/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_icon) {
	'use strict';

	const MAX_BARS = 20;
	const ANIMATION_SMOOTHING_FACTOR = 0.2;
	const ANIMATION_THRESHOLD = 0.001;
	const CallVoiceIndicator = ui_vue3.defineComponent({
		name: 'CallVoiceIndicator',
		components: {
			CallIcon: call_component_ui_icon.CallIcon
		},
		props: {
			level: {
				type: Number,
				default: 0,
				validator: v => v >= 0 && v <= 1
			},
			isMuted: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				bars: Array.from({
					length: MAX_BARS
				}, (_, i) => ({
					index: i
				})),
				animatedLevel: 0,
				animationFrame: null
			};
		},
		computed: {
			activeCount() {
				if (this.isMuted) {
					return 0;
				}
				return Math.floor(this.animatedLevel * MAX_BARS);
			}
		},
		watch: {
			level: {
				handler() {
					this.animateToLevel();
				},
				immediate: true
			}
		},
		beforeUnmount() {
			if (this.animationFrame) {
				cancelAnimationFrame(this.animationFrame);
				this.animationFrame = null;
			}
		},
		methods: {
			animateToLevel() {
				const animate = () => {
					const diff = this.level - this.animatedLevel;
					if (Math.abs(diff) > ANIMATION_THRESHOLD) {
						this.animatedLevel += diff * ANIMATION_SMOOTHING_FACTOR;
						this.animationFrame = requestAnimationFrame(animate);
					} else {
						this.animatedLevel = this.level;
						this.animationFrame = null;
					}
				};
				if (this.animationFrame) {
					cancelAnimationFrame(this.animationFrame);
					this.animationFrame = null;
				}
				animate();
			}
		},
		template: `
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
	`
	});

	exports.CallVoiceIndicator = CallVoiceIndicator;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.Ui);
//# sourceMappingURL=voice-indicator.bundle.js.map
