import { Type } from 'main.core';

import { formatTime } from '../lib/time-tracking-util';

import './time-tracking-timer.css';

// @vue/component
export const TimeTrackingTimer = {
	name: 'TasksTimeTrackingTimer',
	props: {
		timeSpent: {
			type: Number,
			default: 0,
			validator: (value) => value >= 0,
		},
		totalTime: {
			type: Number,
			default: null,
		},
		isRunning: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update'],
	data(): Object
	{
		return {
			internalCurrentTime: 0,
			timer: null,
			internalIsRunning: false,
		};
	},
	computed: {
		hasTotalTime(): boolean
		{
			return !Type.isNil(this.totalTime) && this.totalTime > 0;
		},
		isTotalTimeExceeded(): boolean
		{
			return this.hasTotalTime && this.internalCurrentTime > this.totalTime;
		},
		formattedCurrentTime(): string
		{
			return formatTime(this.internalCurrentTime);
		},
		formattedTotalTime(): string
		{
			return formatTime(this.totalTime);
		},
		currentTimeClass(): string
		{
			if (!this.internalIsRunning)
			{
				return '';
			}

			return '--running';
		},
		totalTimeClass(): string
		{
			if (this.isTotalTimeExceeded)
			{
				return '--exceeded';
			}

			return '';
		},
	},
	watch: {
		timeSpent: {
			immediate: true,
			handler(newVal): void
			{
				this.internalCurrentTime = newVal;
			},
		},
		isRunning: {
			immediate: true,
			handler(newVal): void
			{
				if (newVal)
				{
					this.startTimer();
				}
				else
				{
					this.stopTimer();
				}
			},
		},
	},
	beforeUnmount(): void
	{
		this.stopTimer();
	},
	methods: {
		startTimer(): void
		{
			this.stopTimer();

			this.internalIsRunning = true;

			this.timer = setInterval(() => {
				this.internalCurrentTime++;
				this.$emit('update', this.internalCurrentTime);
			}, 1000);
		},
		stopTimer(): void
		{
			this.internalIsRunning = false;

			if (this.timer)
			{
				clearInterval(this.timer);
				this.timer = null;
			}
		},
		setTime(seconds): void
		{
			this.internalCurrentTime = Math.max(0, Math.min(seconds, this.totalTime));
			this.$emit('update', this.internalCurrentTime);
		},
	},
	template: `
		<div class="tasks-task-time-tracking-timer">
			<div class="tasks-task-time-tracking-timer-current" :class="currentTimeClass">
				{{ formattedCurrentTime }}
			</div>
			<div v-if="hasTotalTime" class="tasks-task-time-tracking-timer-separator"> / </div>
			<div v-if="hasTotalTime" class="tasks-task-time-tracking-timer-total" :class="totalTimeClass">
				{{ formattedTotalTime }}
			</div>
		</div>
	`,
};
