import './css/timeline.css';

import type { JsonObject } from 'main.core';

const Wave = {
	count: 5,
	verticalShift: 44,
	activeVerticalShift: 19,
};

export const getRandomWaveformIndex = (): number => Math.floor(Math.random() * Wave.count);

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
		waveformIndex: {
			type: Number,
			default: null,
		},
		stretched: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['change'],
	data(): JsonObject {
		return {
			seekerOffset: 0,
			containerWidth: 0,
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
		trackWidth(): number
		{
			return this.containerWidth;
		},
		progressPosition(): JsonObject
		{
			if (!this.loaded || this.timeCurrent === 0)
			{
				return { width: '100%' };
			}

			const offset = Math.round(this.trackWidth / 100 * this.progress);

			return { width: `${offset}px` };
		},
		waveType(): number
		{
			return this.waveformIndex ?? this.ownWaveformIndex;
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
		this.ownWaveformIndex = getRandomWaveformIndex();
	},
	mounted()
	{
		this.initResizeObserver();
	},
	beforeUnmount()
	{
		this.getResizeObserver()?.disconnect();
	},
	methods: {
		initResizeObserver()
		{
			this.containerWidth = this.$refs.timeline.offsetWidth;
			this.resizeObserver = new ResizeObserver(([entry]) => {
				this.containerWidth = entry.contentRect.width;
			});
			this.resizeObserver.observe(this.$refs.timeline);
		},
		getResizeObserver(): ?ResizeObserver
		{
			return this.resizeObserver;
		},
		setPosition()
		{
			if (!this.loaded || !this.withSeeking)
			{
				return;
			}

			const pixelPerPercent = this.trackWidth / 100;
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
			:class="{'--with-seeking': withSeeking, '--stretched': stretched}"
			class="bx-im-player-timeline__container" 
			data-testid="im-player-timeline"
			@click="setPosition" 
			@mousemove="updateSeekerPosition" 
		>
			<div class="bx-im-player-timeline__wave" :style="waveStyles"></div>
			<div class="bx-im-player-timeline__wave" :style="activeWaveStyles"></div>
			<div class="bx-im-player-timeline__seeker" :style="seekerPositionStyles"></div>
		</div>
	`,
};
