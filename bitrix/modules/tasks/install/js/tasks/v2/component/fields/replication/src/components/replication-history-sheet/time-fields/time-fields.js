import { DateTimeFormat } from 'main.date';

import { timezone } from 'tasks.v2.lib.timezone';

// @vue/component
export const TimeFields = {
	props: {
		getGrid: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			systemLogTimeRef: [],
			systemLogTime: [],
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const time = this.getGrid().querySelectorAll('[data-system-log-time]');

			this.systemLogTime = [...time].map((systemLogTimeNode: HTMLElement) => this.getSystemLogTime(systemLogTimeNode));

			await this.$nextTick();

			time.forEach((systemLogTimeNode: HTMLElement) => {
				const systemLogTime = this.getSystemLogTime(systemLogTimeNode);
				systemLogTimeNode.append(this.systemLogTimeRef[systemLogTime.rowId]);
			});
		},
		getSystemLogTime(systemLogTimeNode: HTMLElement): Object
		{
			const rowId = Number(systemLogTimeNode.closest('[data-id]').dataset.id);
			const offsetTimestamp = this.getOffsetTimestamp(systemLogTimeNode.dataset.systemLogTime);

			return {
				rowId,
				offsetTimestamp,
			};
		},
		getOffsetTimestamp(timestampString: string): number
		{
			const timestamp = Number(timestampString) * 1000;
			const offset = timezone.getOffset(timestamp);
			const offsetTimestamp = (timestamp + offset) / 1000;

			return DateTimeFormat.format(DateTimeFormat.getFormat('FORMAT_DATETIME'), offsetTimestamp);
		},
		setRef(element: HTMLElement, rowId: number): void
		{
			this.systemLogTimeRef ??= {};
			this.systemLogTimeRef[rowId] = element;
		},
	},
	template: `
		<template v-for="(time, id) in systemLogTime" :key="id">
			<div :ref="(el) => setRef(el, time.rowId)">{{ time.offsetTimestamp }}</div>
		</template>
	`,
};
