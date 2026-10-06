import { Type } from 'main.core';

import './css/lobby-mic-level.css';

const BAR_COUNT = 20;
const BAR_DISABLED_COLOR = 'rgba(255, 255, 255, 0.42)';
const BAR_ENABLED_COLOR = '#1cae6a';

// @vue/component
export const LobbyMicLevel = {
	name: 'LobbyMicLevel',
	props: {
		stream: {
			type: MediaStream,
			default: null,
		},
	},
	setup()
	{
		// non-reactive audio analysis state, assigned in startAudioCheck()/stopAudioCheck()
		return {
			audioContext: null,
			analyser: null,
			frequencyData: null,
			lastBarsToColor: -1,
			rafId: null,
		};
	},
	data()
	{
		return {
			barValues: new Array(BAR_COUNT).fill(false),
		};
	},
	watch: {
		stream(newStream)
		{
			this.stopAudioCheck();

			if (!Type.isNil(newStream))
			{
				this.startAudioCheck();
			}
		},
	},
	mounted()
	{
		if (!Type.isNil(this.stream))
		{
			this.startAudioCheck();
		}
	},
	beforeUnmount()
	{
		this.stopAudioCheck();
	},
	methods: {
		startAudioCheck()
		{
			this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.smoothingTimeConstant = 0.8;
			this.analyser.fftSize = 1024;

			this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
			this.lastBarsToColor = -1;

			const microphone = this.audioContext.createMediaStreamSource(this.stream);
			microphone.connect(this.analyser);

			const tick = () =>
			{
				this.processVolume();
				this.rafId = requestAnimationFrame(tick);
			};

			this.rafId = requestAnimationFrame(tick);
		},
		stopAudioCheck()
		{
			if (this.rafId)
			{
				cancelAnimationFrame(this.rafId);
				this.rafId = null;
			}

			if (this.audioContext)
			{
				this.audioContext.close();
				this.audioContext = null;
			}

			this.analyser = null;
			this.frequencyData = null;
			this.lastBarsToColor = -1;
			this.barValues = new Array(BAR_COUNT).fill(false);
		},
		processVolume()
		{
			this.analyser.getByteFrequencyData(this.frequencyData);

			const values = this.frequencyData.reduce((sum, val) => sum + val, 0);
			const average = values / this.frequencyData.length;

			// Note: getByteFrequencyData returns 0-255 per bin while the bar scale is 0-100.
			// The mismatch is intentional: it boosts sensitivity so normal speech fills the bars.
			const oneBarValue = 100 / BAR_COUNT;
			const barsToColor = Math.min(Math.round(average / oneBarValue), BAR_COUNT);

			if (barsToColor === this.lastBarsToColor)
			{
				return;
			}

			this.lastBarsToColor = barsToColor;
			this.barValues = new Array(BAR_COUNT).fill(false).map((_, i) => i < barsToColor);
		},
		getBarStyle(active)
		{
			return {
				backgroundColor: active ? BAR_ENABLED_COLOR : BAR_DISABLED_COLOR,
			};
		},
	},
	template: /* HTML */`
		<div class="call-lobby-mic-level">
			<div class="call-lobby-mic-level__icon"></div>
			<div class="call-lobby-mic-level__bars" aria-hidden="true">
				<div
					v-for="(active, index) in barValues"
					:key="index"
					class="call-lobby-mic-level__bar"
					:style="getBarStyle(active)"
				></div>
			</div>
		</div>
	`,
};
