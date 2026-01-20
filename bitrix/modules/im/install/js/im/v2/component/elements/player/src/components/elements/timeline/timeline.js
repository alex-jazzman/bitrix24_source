import './css/timeline.css';

import type { JsonObject } from 'main.core';

const Wave = {
	verticalShift: 44,
	activeVerticalShift: 19,
};

// @vue/component
export const Timeline = {
	name: 'PLayerTimeline',
	props: {
		loaded: {
			type: Boolean,
			default: false,
		},
		timeCurrent: {
			type: Number,
			required: true,
		},
		timeTotal: {
			type: Number,
			required: true,
		},
		withSeeking: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['change'],
	data(): JsonObject {
		return {
			seekerOffset: 0,
		};
	},
	computed: {
		progress(): number
		{
			return Math.round((100 / this.timeTotal) * this.timeCurrent);
		},
		seekerPositionStyles(): JsonObject
		{
			if (!this.loaded || !this.withSeeking)
			{
				return { display: 'none' };
			}

			return { left: `${this.seekerOffset}px` };
		},
		progressPosition(): JsonObject
		{
			if (!this.loaded || this.timeCurrent === 0)
			{
				return { width: '100%' };
			}

			const offset = Math.round(this.$refs.timeline.offsetWidth / 100 * this.progress);

			return { width: `${offset}px` };
		},
		activeWaveStyles(): JsonObject
		{
			const shift = this.waveType * Wave.verticalShift + Wave.activeVerticalShift;

			return {
				...this.progressPosition,
				'background-position-y': `-${shift}px`,
			};
		},
		waveStyles(): JsonObject
		{
			const shift = this.waveType * Wave.verticalShift;

			return {
				'background-position-y': `-${shift}px`,
			};
		},
	},
	created()
	{
		this.waveType = Math.floor(Math.random() * 5);
	},
	methods: {
		setPosition()
		{
			if (!this.loaded || !this.withSeeking)
			{
				return;
			}

			const pixelPerPercent = this.$refs.timeline.offsetWidth / 100;
			const progress = Math.round(this.seekerOffset / pixelPerPercent);

			this.$emit('change', progress);
		},
		updateSeekerPosition(event: MouseEvent)
		{
			if (!this.loaded || !this.withSeeking)
			{
				return;
			}

			this.seekerOffset = event.offsetX > 0 ? event.offsetX : 0;
		},
	},
	template: `
		<div 
			ref="timeline"
			:class="{'--with-seeking': withSeeking}"
			class="bx-im-player-timeline__container" 
			@click="setPosition" 
			@mousemove="updateSeekerPosition" 
		>
			<div class="bx-im-player-timeline__wave" :style="waveStyles"></div>
			<div class="bx-im-player-timeline__wave" :style="activeWaveStyles"></div>
			<div class="bx-im-player-timeline__seeker" :style="seekerPositionStyles"></div>
		</div>
	`,
};
