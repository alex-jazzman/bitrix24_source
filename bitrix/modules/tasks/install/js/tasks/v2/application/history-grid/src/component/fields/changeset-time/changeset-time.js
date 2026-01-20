import { timezone } from 'tasks.v2.lib.timezone';
import { DateTimeFormat } from 'main.date';

// @vue/component
export const ChangesetTime = {
	props: {
		getGrid: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			changesetTimeRef: [],
			changesetTime: [],
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const time = this.getGrid().querySelectorAll('[data-time]');

			this.changesetTime = [...time].map((changesetTimeNode: HTMLElement) => this.getChangesetTime(changesetTimeNode));

			await this.$nextTick();

			time.forEach((changesetTimeNode: HTMLElement) => {
				const changesetTime = this.getChangesetTime(changesetTimeNode);
				changesetTimeNode.append(this.changesetTimeRef[changesetTime.rowId]);
			});
		},
		getChangesetTime(changesetTimeNode: HTMLElement): Object
		{
			const rowId = Number(changesetTimeNode.closest('[data-id]').dataset.id);
			const offsetTimestamp = this.getOffsetTimestamp(changesetTimeNode.dataset.time);

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
			this.changesetTimeRef ??= {};
			this.changesetTimeRef[rowId] = element;
		},
	},
	template: `
		<template v-for="(time, id) in changesetTime" :key="id">
			<div :ref="(el) => setRef(el, time.rowId)">{{ time.offsetTimestamp }}</div>
		</template>
	`,
};
