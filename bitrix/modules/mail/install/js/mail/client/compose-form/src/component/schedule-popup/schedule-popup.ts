import { Runtime } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { type DatePicker } from 'ui.date-picker';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';

import './schedule-popup.css';

const TestId = Object.freeze({
	popup: 'mail-compose-schedule-popup',
	calendar: 'mail-compose-schedule-calendar',
	presets: 'mail-compose-schedule-presets',
});

const CardPadding = 16;

/** Gap below the split button half the popup is bound to. */
const PopupOffsetTop = 5;

/** Preset labels in render order; resolving them to dates belongs to a separate task. */
const Preset = Object.freeze([
	Phrase.SchedulePresetToday,
	Phrase.SchedulePresetTomorrow,
	Phrase.SchedulePresetWeekEnd,
	Phrase.SchedulePresetNextWeek,
	Phrase.SchedulePresetMonthEnd,
]);

type PresetView = {
	label: string,
	testId: string,
};

/** Options of the inline calendar, as this popup asks for it. */
type DatePickerOptions = {
	targetNode: HTMLElement,
	selectionMode: string,
	inline: boolean,
	enableTime: boolean,
};

export type DatePickerClass = new (options: DatePickerOptions) => DatePicker;

type DatePickerExtension = {
	DatePicker: DatePickerClass,
};

/**
 * The calendar is the heaviest dependency of the screen and this popup is the only place that needs it, so it
 * is kept out of the dependencies of the form and asked for when the popup is opened. `main.core` remembers a
 * loaded extension, so the second opening costs no request; it also declares an array where it answers with
 * the namespace of the extension.
 */
export function loadDatePicker(): Promise<DatePickerClass>
{
	return (Runtime.loadExtension('ui.date-picker') as unknown as Promise<DatePickerExtension>)
		.then((extension: DatePickerExtension): DatePickerClass => extension.DatePicker);
}

/**
 * `ui.date-picker` has no Vue wrapper, so it is a vanilla instance rendered into a node of its own: it
 * draws the month, the days and the time row itself. The instance is kept out of the reactive state and
 * taken down with the popup.
 *
 * Scheduling itself is implemented by a separate task, so the chosen date leaves the popup nowhere yet.
 */
// @vue/component
export const SchedulePopup = defineComponent({
	name: 'MailComposeSchedulePopup',

	components: {
		Popup,
		UiButton,
	},

	props: {
		/** The split button half the popup is bound to. */
		bindElement: {
			type: Object as PropType<HTMLElement>,
			required: true,
		},

		/**
		 * The class of the calendar, loaded by the owner of the popup: `ui.date-picker` does not come with the
		 * form. Asked for as a property rather than loaded here, so the calendar stands in the card from the
		 * first frame and the focus trap of the popup meets it whole. `PropType` describes a property by the
		 * instances of its class, and this one carries the class itself, hence the cast.
		 */
		datePicker: {
			type: Function as unknown as PropType<DatePickerClass>,
			required: true,
		},
	},

	emits: ['close'],

	setup()
	{
		return {
			presetStyle: AirButtonStyle.OUTLINE,
			presetSize: ButtonSize.LARGE,
			testId: TestId,
		};
	},

	data()
	{
		return {
			// Keeps private class fields, so it stays outside the reactive state like the other vanilla
			// instances of the form.
			picker: null as DatePicker | null,
		};
	},

	computed: {
		options(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				targetContainer: document.body,
				offsetTop: PopupOffsetTop,
				padding: CardPadding,
				focusTrap: true,
				closeByEsc: true,
				ariaLabel: loc(Phrase.ScheduleButton),
			};
		},

		presets(): PresetView[]
		{
			return Preset.map((phrase: string, index: number): PresetView => ({
				label: loc(phrase),
				testId: `mail-compose-schedule-preset-${index}`,
			}));
		},
	},

	mounted(): void
	{
		this.createPicker();
	},

	beforeUnmount(): void
	{
		this.picker?.destroy();
		this.picker = null;
	},

	methods: {
		/**
		 * The calendar stands inside the card rather than in a popup of its own, so the picker is inline:
		 * `show()` of an inline picker draws it in the node it was given instead of opening a window.
		 *
		 * The picked date stays in the instance, where the scheduling task will read it from.
		 */
		createPicker(): void
		{
			const Calendar = this.datePicker;
			const picker = markRaw(new Calendar({
				targetNode: this.$refs.calendar as HTMLElement,
				selectionMode: 'single',
				inline: true,
				enableTime: true,
			}));

			this.picker = picker;
			picker.show();
		},

		/** Integration point: scheduling the send is implemented by a separate task. */
		handlePresetClick(): void
		{},
	},

	template: `
		<Popup :options="options" @close="$emit('close')">
			<div class="mail-compose-schedule" :data-testid="testId.popup">
				<div
					ref="calendar"
					class="mail-compose-schedule__calendar"
					:data-testid="testId.calendar"
				></div>
				<div class="mail-compose-schedule__presets" :data-testid="testId.presets">
					<UiButton
						v-for="preset of presets"
						:key="preset.testId"
						:text="preset.label"
						:style="presetStyle"
						:size="presetSize"
						wide
						:dataset="{ testid: preset.testId }"
						@click="handlePresetClick"
					/>
				</div>
			</div>
		</Popup>
	`,
});
