import { Text, Type } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import { DateTimeFormat } from 'main.date';

import { mapGetters } from 'ui.vue3.vuex';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';

import './time-tracking-list-item-edit.css';

// @vue/component
export const TimeTrackingListItemEdit = {
	name: 'TasksTimeTrackingListItemEdit',
	components: {
		BIcon,
		BInput,
		UiButton,
	},
	inject: {
		taskId: {},
	},
	props: {
		elapsedTimeCreatedAtTs: {
			type: Number,
			default: 0,
		},
		elapsedTimeSeconds: {
			type: Number,
			default: 0,
		},
		elapsedTimeText: {
			type: String,
			default: '',
		},
	},
	emits: ['save', 'cancel'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			ButtonIcon,
			ButtonColor,
			InputDesign,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isCalendarShown: false,
			localCreatedAt: null,
			localSeconds: 0,
			localText: '',
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		hours: {
			get(): string
			{
				const hour = Math.floor(this.localSeconds / 3600);
				if (hour === 0)
				{
					return '';
				}

				return String(hour) || '';
			},
			set(value: number): void
			{
				let hours = value === '' ? 0 : parseInt(value, 10);
				if (!Type.isNumber(hours))
				{
					return;
				}

				hours = Math.abs(hours);

				const minutes = this.minutes;
				this.localSeconds = (hours * 3600) + (minutes * 60);
			},
		},
		minutes: {
			get(): string
			{
				const minutes = Math.floor((this.localSeconds % 3600) / 60);
				if (minutes === 0)
				{
					return '';
				}

				return String(minutes) || '';
			},
			set(value: number): void
			{
				let minutes = value === '' ? 0 : parseInt(value, 10);
				if (!Type.isNumber(minutes))
				{
					return;
				}

				minutes = Math.abs(minutes);

				const hours = this.hours;
				this.localSeconds = (hours * 3600) + (minutes * 60);
			},
		},
		text: {
			get(): string
			{
				return this.localText;
			},
			set(value: string): void
			{
				this.localText = value;
			},
		},
	},
	watch: {
		isCalendarShown(value: boolean): void
		{
			if (value)
			{
				this.datePicker.show();
			}
			else
			{
				this.datePicker.hide();
			}
		},
	},
	created(): void
	{
		const createdDate = this.getCreatedDate();
		this.localCreatedAt = new Date(createdDate.getTime() + timezone.getOffset(createdDate.getTime()));

		this.localSeconds = this.elapsedTimeSeconds;
		this.localText = this.elapsedTimeText;
	},
	mounted(): void
	{
		this.datePicker = this.createDatePicker();
	},
	unmounted(): void
	{
		this.datePicker?.destroy();
	},
	methods: {
		createDatePicker(): DatePicker
		{
			const selectedDateTs = this.localCreatedAt ? this.localCreatedAt.getTime() : null;

			return new DatePicker({
				popupOptions: {
					id: `tasks-time-tracking-list-popup-${Text.getRandom()}`,
					bindElement: this.$refs.calendarInput.$el,
					bindOptions: { forceBindPosition: true },
					events: {
						onClose: (): void => {
							this.isCalendarShown = false;
						},
					},
				},
				selectedDates: [selectedDateTs],
				enableTime: true,
				events: {
					[DatePickerEvent.SELECT]: (event: BaseEvent) => {
						const { date } = event.getData();
						this.localCreatedAt = calendar.createDateFromUtc(date);
					},
				},
			});
		},
		getCreatedDate(): ?Date
		{
			if (!this.elapsedTimeCreatedAtTs)
			{
				return new Date();
			}

			return new Date(this.elapsedTimeCreatedAtTs * 1000);
		},
		formatDate(date: ?Date): ?string
		{
			if (!date)
			{
				return null;
			}

			const format = this.loc('TASKS_V2_DATE_TIME_FORMAT', {
				'#DATE#': DateTimeFormat.getFormat('FORMAT_DATE'),
				'#TIME#': DateTimeFormat.getFormat('SHORT_TIME_FORMAT'),
			});

			return DateTimeFormat.format(format, date);
		},
		save(): void
		{
			const offset = timezone.getOffset(this.localCreatedAt.getTime());
			const localCreatedAt = new Date(this.localCreatedAt.getTime() - offset);

			this.$emit('save', {
				taskId: this.taskId,
				createdAtTs: Math.floor(localCreatedAt.getTime() / 1000),
				seconds: this.localSeconds,
				text: this.localText,
				source: 'manual',
				rights: {
					edit: true,
					remove: true,
				},
			});
		},
	},
	template: `
		<div class="tasks-time-tracking-list-row">
			<div class="tasks-time-tracking-list-item-edit">
				<div class="tasks-time-tracking-list-item-edit-time">
					<BInput
						ref="calendarInput"
						class="tasks-time-tracking-list-item-edit-time-calendar"
						:modelValue="formatDate(localCreatedAt)"
						:design="InputDesign.LightGrey"
						clickable
						:label="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_DATE')"
						@click="isCalendarShown = !isCalendarShown"
					/>
					<BInput
						v-model="hours"
						class="tasks-time-tracking-list-item-edit-time-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_HOUR')"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_INPUT_H')"
					/>
					<BInput
						v-model="minutes"
						class="tasks-time-tracking-list-item-edit-time-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_MINUTES')"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_INPUT_M')"
					/>
					<UiButton
						:leftIcon="Outline.CHECK_L"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.SMALL"
						@click="save"
					/>
					<BIcon
						:name="Outline.CROSS_L"
						hoverable
						class="tasks-time-tracking-list-item-edit-close-icon"
						@click="$emit('cancel')"
					/>
				</div>
				<div class="tasks-time-tracking-list-item-edit-text">
					<BInput
						v-model="text"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_TEXT')"
						:rowsQuantity="3"
						active
						resize="none"
					/>
				</div>
			</div>
		</div>
	`,
};
