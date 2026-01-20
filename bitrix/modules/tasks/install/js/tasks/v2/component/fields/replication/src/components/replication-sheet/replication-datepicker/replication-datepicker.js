import { Text } from 'main.core';
import type { BaseEvent } from 'main.core.events';

import { Popup } from 'ui.vue3.components.popup';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';

import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';

// @vue/component
export const ReplicationDatepicker = {
	name: 'ReplicationDatepicker',
	components: {
		Popup,
	},
	inject: {
		/** @type{number|string} */
		taskId: {},
	},
	props: {
		dateTs: {
			type: Number,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['update:dateTs', 'close'],
	data(): { dateTsModel: ?number }
	{
		return {
			dateTsModel: null,
		};
	},
	created(): void
	{
		this.datePicker = this.createDatePicker();

		const date = new Date(this.dateTs + timezone.getOffset(this.dateTs));
		this.dateTsModel = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	},
	mounted(): void
	{
		this.datePicker.show();
	},
	unmounted(): void
	{
		this.datePicker?.destroy();
	},
	methods: {
		createDatePicker(): DatePicker
		{
			const offset = timezone.getOffset(this.dateTs);

			const picker = new DatePicker({
				popupOptions: {
					id: `tasks-replication-date-picker-${this.taskId}-${Text.getRandom()}`,
					bindElement: this.bindElement,
					offsetTop: 5,
					offsetLeft: -40,
					targetContainer: document.body,
					events: {
						onClose: () => this.$emit('close'),
					},
				},
				selectedDates: [this.dateTs + offset],
				events: {
					[DatePickerEvent.SELECT]: (event: BaseEvent) => {
						const { date } = event.getData();
						const dateTsModel = calendar.createDateFromUtc(date).getTime();
						this.$emit('update:dateTs', dateTsModel - timezone.getOffset(dateTsModel));
					},
				},
			});

			picker.getPicker('day').subscribe('onSelect', (event: BaseEvent) => {
				const { year, month, day } = event.getData();
				const dateTsModel = new Date(year, month, day).getTime();

				this.$emit('close');

				this.dateTsModel = dateTsModel;
			});

			return picker;
		},
	},
	template: '<div ref="picker"/>',
};
