import { Type } from 'main.core';
import { Column } from './column';

const TIMER_UP_BOUNDARY: number = 60 * 60; // 1 hour

export const ColumnRunning = {
	name: 'bp-workflow-faces-column-running',
	components: {
		Column,
	},
	props: {
		avatars: Array,
		time: Number,
	},
	data(): Object
	{
		return {
			timer: null,
			computedTime: 0,
			startTime: Math.floor(Date.now() / 1000),
		};
	},
	computed: {
		hasAvatars(): boolean
		{
			return Type.isArrayFilled(this.avatars);
		},
	},
	mounted()
	{
		this.startTimer();
	},
	unmounted()
	{
		this.stopTimer();
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		startTimer()
		{
			this.timer = setInterval(() => {
				if (this.time + this.computedTime < TIMER_UP_BOUNDARY)
				{
					this.computedTime = Math.floor(Date.now() / 1000) - this.startTime;

					return;
				}

				this.stopTimer();
			}, 1000);
		},
		stopTimer()
		{
			if (this.timer)
			{
				clearInterval(this.timer);
				this.timer = null;
			}
		},
	},
	template: `
		<Column
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_RUNNING')"
			:avatars="hasAvatars ? avatars : null"
			:status="'progress'"
			:time="time + computedTime"
		/>
	`,
};
