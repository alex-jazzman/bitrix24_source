import { Runtime, Type } from 'main.core';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { mapState } from 'ui.vue3.pinia';

import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { Calendar } from 'socialnetwork.v2.lib.calendar';
import { Timezone } from 'socialnetwork.v2.lib.timezone';
import { useProjectStore } from 'socialnetwork.v2.model.project';

import { InjectionKey } from '../../../../../const';

import './project-dates-field.css';

type DateField = 'start' | 'finish';

type ProjectDatesFieldSetupProps = {
	datePicker: DateField | null,
	handlePickerChangedDebounced: (() => void) | null,
	Outline: typeof Outline,
	InputDesign: typeof InputDesign,
};

// @vue/component
export const ProjectDatesField = {
	name: 'ProjectDatesField',
	components: {
		UiField,
		BInput,
	},
	inject: {
		getWizardBodyContainer: {
			from: InjectionKey.GetWizardBodyContainer,
			default: () => document.body,
		},
	},
	setup(): ProjectDatesFieldSetupProps
	{
		return {
			datePicker: null,
			handlePickerChangedDebounced: null,
			Outline,
			InputDesign,
		};
	},
	data(): { activeField: DateField | null, pickerVisible: boolean }
	{
		return {
			activeField: null,
			pickerVisible: false,
		};
	},
	computed: {
		...mapState(useProjectStore, ['dates']),
		startTs: {
			get(): number | null
			{
				return this.dates?.startTs ?? null;
			},
			set(value: number | null): void
			{
				const store = useProjectStore();
				store.dates.startTs = value;
			},
		},
		finishTs: {
			get(): number | null
			{
				return this.dates?.finishTs ?? null;
			},
			set(value: number | null): void
			{
				const store = useProjectStore();
				store.dates.finishTs = value;
			},
		},
		targetContainer(): HTMLElement
		{
			return this.getWizardBodyContainer() ?? document.body;
		},
		formattedStartDate(): string
		{
			return this.formatDate(this.startTs);
		},
		formattedFinishDate(): string
		{
			return this.formatDate(this.finishTs);
		},
		pickerShown(): { [DateField]: boolean }
		{
			return {
				start: this.pickerVisible && this.activeField === 'start',
				finish: this.pickerVisible && this.activeField === 'finish',
			};
		},
	},
	beforeUnmount(): void
	{
		this.datePicker?.destroy();
		this.datePicker = null;
	},
	methods: {
		formatDate(ts: number | null): string
		{
			if (!ts)
			{
				return '';
			}

			return Calendar.formatDate(ts, { forceYear: true });
		},
		preparePickerTimestamp(date: ?Date): number | null
		{
			return Type.isDate(date) ? this.removeOffset(Calendar.createDateFromUtc(date).getTime()) : null;
		},
		setFieldValue(startTs: number | null, finishTs: number | null): void
		{
			this.startTs = startTs;
			this.finishTs = finishTs;

			this.updateDatePicker(this.startTs, this.finishTs);
		},
		getFieldValue(field: DateField): number | null
		{
			return field === 'start' ? this.startTs : this.finishTs;
		},
		clearValue(field: DateField): void
		{
			if (field === 'start')
			{
				this.setFieldValue(null, this.finishTs);
			}
			else if (field === 'finish')
			{
				this.setFieldValue(this.startTs, null);
			}
		},
		getDatePicker(): DatePicker
		{
			this.handlePickerChangedDebounced ??= Runtime.debounce(this.handlePickerChanged, 10, this);
			this.datePicker ??= new DatePicker({
				enableTime: false,
				selectionMode: 'range',
				defaultTime: Calendar.dayEndTime,
				autoHide: true,
				popupOptions: {
					animation: 'fading',
					targetContainer: this.targetContainer,
				},
				events: {
					[DatePickerEvent.SELECT]: this.handlePickerChangedDebounced,
					[DatePickerEvent.DESELECT]: this.handlePickerChangedDebounced,
					onShow: (): void => {
						this.pickerVisible = true;
					},
					onHide: (): void => {
						this.pickerVisible = false;
						this.activeField = null;
					},
				},
			});

			return this.datePicker;
		},
		handlePickerChanged(): void
		{
			let startTs = this.preparePickerTimestamp(this.datePicker?.getRangeStart());
			let finishTs = this.preparePickerTimestamp(this.datePicker?.getRangeEnd());

			if (this.pickerShown.finish && !finishTs && !this.startTs)
			{
				[startTs, finishTs] = [null, startTs];
			}

			if (startTs && !this.startTs)
			{
				startTs = Calendar.setHours(startTs, Calendar.workdayStart.H, Calendar.workdayStart.M);
			}

			this.setFieldValue(startTs, finishTs);
		},
		handleDateClick(field: DateField, event: MouseEvent): void
		{
			this.activeField = field;

			const datePicker = this.getDatePicker();
			datePicker.setTargetNode(event.currentTarget);
			datePicker.show();

			const value = this.getFieldValue(field);
			if (value)
			{
				datePicker.setFocusDate(this.applyOffset(value));
			}
		},
		updateDatePicker(startTs: number | null, finishTs: number | null): void
		{
			const datePicker = this.getDatePicker();
			const options = { emitEvents: false };

			if (!startTs && !finishTs)
			{
				datePicker.deselectAll(options);

				return;
			}

			if (startTs > 0)
			{
				datePicker.selectRange(
					this.applyOffset(startTs),
					this.applyOffset(finishTs),
					options,
				);
			}
			else if (finishTs > 0)
			{
				datePicker.selectRange(
					this.applyOffset(finishTs),
					null,
					options,
				);
			}
		},
		applyOffset(timestamp: number | null): number | null
		{
			return Type.isNumber(timestamp) ? timestamp + Timezone.getOffset(timestamp) : timestamp;
		},
		removeOffset(timestamp: number | null): number | null
		{
			return Type.isNumber(timestamp) ? timestamp - Timezone.getOffset(timestamp) : timestamp;
		},
	},
	template: `
		<UiField
			ref="datesField"
			:label="loc('SONET_EXT_PROJECT_WIZARD_PROJECT_DATES_FIELD_LABEL')"
			:hint="loc('SONET_EXT_PROJECT_WIZARD_PROJECT_DATES_FIELD_HINT')"
		>
			<div class="socialnetwork--project-wizard--project-dates-field">
				<BInput
					:modelValue="formattedStartDate"
					:icon="Outline.CALENDAR_WITH_SLOTS"
					:design="InputDesign.Grey"
					:active="pickerShown.start"
					:withClear="Boolean(startTs)"
					class="socialnetwork--project-wizard--field-shadow"
					readonly
					@clear="clearValue('start')"
					@click="handleDateClick('start', $event)"
					@keydown.enter.prevent="handleDateClick('start', $event)"
					@keydown.space.prevent="handleDateClick('start', $event)"
					@keydown.down.prevent="handleDateClick('start', $event)"
					@keydown.delete.prevent="clearValue('start')"
				/>
				<div class="socialnetwork--project-wizard--project-dates-field_separator"/>
				<BInput
					:modelValue="formattedFinishDate"
					:icon="Outline.CALENDAR_WITH_SLOTS"
					:design="InputDesign.Grey"
					:active="pickerShown.finish"
					:withClear="Boolean(finishTs)"
					class="socialnetwork--project-wizard--field-shadow"
					readonly
					@clear="clearValue('finish')"
					@click="handleDateClick('finish', $event)"
					@keydown.enter.prevent="handleDateClick('finish', $event)"
					@keydown.space.prevent="handleDateClick('finish', $event)"
					@keydown.down.prevent="handleDateClick('finish', $event)"
					@keydown.delete.prevent="clearValue('finish')"
				/>
			</div>
		</UiField>
	`,
};
