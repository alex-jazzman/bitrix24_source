import { Runtime } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { type DatePicker } from 'ui.date-picker';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';
import { getScheduleTimezoneId, useComposeState } from '../../model/compose/compose';

import './schedule-popup.css';

const TestId = Object.freeze({
	popup: 'mail-compose-schedule-popup',
	calendar: 'mail-compose-schedule-calendar',
	confirm: 'mail-compose-schedule-confirm',
	presets: 'mail-compose-schedule-presets',
	error: 'mail-compose-schedule-error',
});

const CardPadding = 16;

/** Gap below the split button half the popup is bound to. */
const PopupOffsetTop = 5;

/** The moment picked in the calendar, as `mail.client.scheduled-message` names that preset. */
const CustomPreset = 'custom';

/**
 * The code `mail.client.scheduled-message` marks a moment already gone with; the user fixes that one by
 * picking another day, so it is named apart from the refusals they cannot act upon.
 */
const PastTimeErrorCode = 'past_time';

/** Preset labels in render order, by the identifier `mail.client.scheduled-message` resolves to a moment. */
const Preset: Array<{ phrase: string, value: string }> = [
	{ phrase: Phrase.SchedulePresetInOneHour, value: 'inOneHour' },
	{ phrase: Phrase.SchedulePresetTomorrow, value: 'tomorrow' },
	{ phrase: Phrase.SchedulePresetWeekEnd, value: 'weekEnd' },
	{ phrase: Phrase.SchedulePresetNextWeek, value: 'nextWeek' },
	{ phrase: Phrase.SchedulePresetMonthEnd, value: 'monthEnd' },
];

type PresetView = {
	label: string,
	testId: string,
	value: string,
};

/** The wall clock of the author, as `mail.client.scheduled-message` takes a custom moment. */
type SelectedLocalDateTime = {
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
};

type ScheduledTimeOptions = {
	selectedLocalDateTime: SelectedLocalDateTime,
};

type ScheduledMessageExtension = {
	resolveScheduledTimePreset(
		preset: string,
		timezoneId: string,
		options?: ScheduledTimeOptions,
	): { iso: string },
};

/** Options of the inline calendar, as this popup asks for it. */
type DatePickerOptions = {
	targetNode: HTMLElement,
	selectionMode: string,
	inline: boolean,
	enableTime: boolean,
	minDate: Date,
	events?: {
		onSelect(): void,
	},
};

type ScheduledDatePicker = DatePicker & {
	getSelectedDate(): Date | null,
};

export type DatePickerClass = new (options: DatePickerOptions) => DatePicker;

type DatePickerExtension = {
	DatePicker: DatePickerClass,
};

/**
 * A letter saved before the portal held the zone of its author to a known one could carry anything, and a zone
 * this browser cannot read turns every moment of the card into a refusal the user can do nothing about. The
 * screen of a scheduled letter is covered against the same letter and falls back the same way.
 */
function isKnownTimezoneId(timezoneId: string): boolean
{
	try
	{
		return Intl.DateTimeFormat('en', { timeZone: timezoneId }).resolvedOptions().timeZone !== '';
	}
	catch
	{
		return false;
	}
}

/** The date picker reads local fields, so its lower bound must carry the author's wall clock in those fields. */
function currentDateInTimezone(timezoneId: string): Date
{
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezoneId,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hourCycle: 'h23',
	}).formatToParts(new Date());
	const values = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));

	return new Date(
		values.year,
		values.month - 1,
		values.day,
		values.hour,
		values.minute,
		values.second,
	);
}

function dateOf(localDateTime: SelectedLocalDateTime): Date
{
	return new Date(
		localDateTime.year,
		localDateTime.month - 1,
		localDateTime.day,
		localDateTime.hour,
		localDateTime.minute,
		localDateTime.second,
	);
}

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
 * A pick in the calendar is a choice, not a send: the picker announces the day as soon as it is clicked,
 * with the time still at its default, so the moment leaves the card only on the confirmation next to it.
 */
// @vue/component
export const SchedulePopup = defineComponent({
	name: 'MailComposeSchedulePopup',

	components: {
		Alert,
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

	emits: ['close', 'schedule'],

	setup()
	{
		return {
			state: useComposeState(),
			presetStyle: AirButtonStyle.OUTLINE,
			presetSize: ButtonSize.LARGE,
			confirmStyle: AirButtonStyle.FILLED,
			confirmSize: ButtonSize.LARGE,
			errorDesign: AlertDesign.tintedAlert,
			testId: TestId,
		};
	},

	data()
	{
		return {
			// Keeps private class fields, so it stays outside the reactive state like the other vanilla
			// instances of the form.
			picker: null as ScheduledDatePicker | null,
			selectedLocalDateTime: null as SelectedLocalDateTime | null,
			error: '',
			// The extension of the schedule is awaited, so the card outlives the first click on it.
			isScheduling: false,
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
				// The card is opened from the keyboard too, and by default `main.popup` leaves the focus on the
				// card itself, so it is sent to the first control the card holds. `initialFocus` takes the flag
				// rather than `'first-tabbable'`: `ui.a11y` reads any filled string as a CSS selector, so the
				// named value finds nothing and falls back to the card.
				focusTrap: { initialFocus: true },
				closeByEsc: true,
				ariaLabel: loc(Phrase.ScheduleButton),
			};
		},

		presets(): PresetView[]
		{
			return Preset
				.map((preset, index: number): PresetView => ({
					label: loc(preset.phrase),
					testId: `mail-compose-schedule-preset-${index}`,
					value: preset.value,
				}));
		},

		confirmLabel(): string
		{
			return loc(Phrase.ScheduleConfirm);
		},

		isCustomDateAllowed(): boolean
		{
			return this.selectedLocalDateTime !== null
				&& dateOf(this.selectedLocalDateTime) > currentDateInTimezone(this.timezoneId);
		},

		/** The browser is the last fallback of the state as well, so an unreadable zone costs its name only. */
		timezoneId(): string
		{
			const timezoneId = getScheduleTimezoneId(this.state);

			return isKnownTimezoneId(timezoneId)
				? timezoneId
				: Intl.DateTimeFormat().resolvedOptions().timeZone;
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
		 */
		createPicker(): void
		{
			const Calendar = this.datePicker;
			const minDate = currentDateInTimezone(this.timezoneId);
			minDate.setHours(0, 0, 0, 0);
			const picker = markRaw(new Calendar({
				targetNode: this.$refs.calendar as HTMLElement,
				selectionMode: 'single',
				inline: true,
				enableTime: true,
				minDate,
				events: {
					onSelect: this.handleCustomDateSelect,
				},
			}));

			this.picker = picker as ScheduledDatePicker;
			picker.show();
		},

		/**
		 * The picker announces a selection both on the click of a day and on every change of the time row,
		 * so the newest announcement is the whole of the choice. It carries the wall clock of the author in
		 * the UTC fields of its date.
		 */
		handleCustomDateSelect(): void
		{
			const selectedDate = this.picker?.getSelectedDate() ?? null;

			this.selectedLocalDateTime = selectedDate === null ? null : {
				year: selectedDate.getUTCFullYear(),
				month: selectedDate.getUTCMonth() + 1,
				day: selectedDate.getUTCDate(),
				hour: selectedDate.getUTCHours(),
				minute: selectedDate.getUTCMinutes(),
				second: selectedDate.getUTCSeconds(),
			};
		},

		handleCustomConfirm(): void
		{
			const selectedLocalDateTime = this.selectedLocalDateTime;

			if (selectedLocalDateTime !== null)
			{
				void this.schedule(CustomPreset, { selectedLocalDateTime });
			}
		},

		handlePresetClick(preset: PresetView): void
		{
			void this.schedule(preset.value);
		},

		/**
		 * The moment is resolved by `mail.client.scheduled-message`: it is the one that counts the wall clock
		 * of the author in their timezone and refuses a moment already gone, which the server would answer
		 * with an error anyway. A refusal is named inside the card, where the choice was made and where the
		 * user still stands: the error block of the form sits behind the open card.
		 *
		 * One schedule per card: while the moment is being resolved the controls refuse a click and are shown
		 * disabled, so an impatient second click cannot schedule the same letter twice. A moment that resolved
		 * keeps them so — the owner of the card closes it on the very event this method emits.
		 */
		async schedule(preset: string, options?: ScheduledTimeOptions): Promise<void>
		{
			if (this.isScheduling)
			{
				return;
			}

			this.isScheduling = true;
			try
			{
				const { timezoneId } = this;
				const extension = await Runtime.loadExtension(
					'mail.client.scheduled-message',
				) as unknown as ScheduledMessageExtension;
				const scheduledTime = extension.resolveScheduledTimePreset(preset, timezoneId, options);

				this.error = '';
				this.$emit('schedule', { scheduledAt: scheduledTime.iso, timezoneId });
			}
			catch (error)
			{
				// The letter stays in the card, so the user picks another moment: the controls answer again.
				this.isScheduling = false;
				this.error = (error as { code?: string }).code === PastTimeErrorCode
					? loc(Phrase.ScheduleErrorPastTime)
					: loc(Phrase.ScheduleErrorTime);
			}
		},
	},

	template: `
		<Popup :options="options" @close="$emit('close')">
			<div class="mail-compose-schedule" :data-testid="testId.popup">
				<div class="mail-compose-schedule__date">
					<div
						ref="calendar"
						class="mail-compose-schedule__calendar"
						:data-testid="testId.calendar"
					></div>
					<UiButton
						:text="confirmLabel"
						:style="confirmStyle"
						:size="confirmSize"
						:disabled="!isCustomDateAllowed || isScheduling"
						wide
						:dataset="{ testid: testId.confirm }"
						@click="handleCustomConfirm"
					/>
				</div>
				<div class="mail-compose-schedule__presets" :data-testid="testId.presets">
					<UiButton
						v-for="preset of presets"
						:key="preset.testId"
						:text="preset.label"
						:style="presetStyle"
						:size="presetSize"
						:disabled="isScheduling"
						wide
						:dataset="{ testid: preset.testId }"
						@click="handlePresetClick(preset)"
					/>
				</div>
				<div
					v-if="error"
					class="mail-compose-schedule__error"
					:data-testid="testId.error"
					role="alert"
				>
					<Alert :design="errorDesign">{{ error }}</Alert>
				</div>
			</div>
		</Popup>
	`,
});
