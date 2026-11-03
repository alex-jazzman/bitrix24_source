import { Dom, Event, Text, Type } from 'main.core';
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

const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];
const VISIBLE_LABEL_SELECTOR = '.ui-system-input-label:not(.--error)';

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
			calendarPopupId: `tasks-time-tracking-list-popup-${Text.getRandom()}`,
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

			this.syncAria();
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
		this.syncAria();

		// main.popup closes the sheet from a capture-phase keyup listener on the document,
		// so an Escape that only dismisses the picker has to be claimed earlier: capture at
		// the window always runs before capture at the document, whatever the bind order.
		Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
	},
	unmounted(): void
	{
		Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
		this.datePicker?.destroy();
	},
	methods: {
		syncAria(): void
		{
			this.syncDateTriggerAria();
			this.nameSaveButton();
		},
		/**
		 * The trigger is the input wrapper, not the inner input: BInput blurs the input
		 * on focus in the clickable mode, so a tab stop on it swallows the focus.
		 *
		 * A combobox reads its value off the text of its own subtree, so the visible label
		 * has to leave the accessibility tree: it would repeat the name in place of the
		 * value. The input stays there - it always shows the date of the record, which is
		 * exactly the value the role has to read.
		 */
		syncDateTriggerAria(): void
		{
			const trigger = this.$refs.calendarInput?.$el;
			const input = trigger?.querySelector('input');
			if (!input)
			{
				return;
			}

			Dom.attr(trigger, 'role', 'combobox');
			Dom.attr(trigger, 'aria-label', this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_DATE'));
			Dom.attr(trigger, 'aria-haspopup', 'dialog');
			Dom.attr(trigger, 'aria-expanded', this.isCalendarShown ? 'true' : 'false');
			Dom.attr(trigger, 'aria-controls', this.isCalendarShown ? this.calendarPopupId : null);
			Dom.attr(trigger, 'tabindex', '0');
			Dom.attr(trigger.querySelector(VISIBLE_LABEL_SELECTOR), 'aria-hidden', 'true');
			Dom.attr(input, 'tabindex', '-1');
		},
		/**
		 * ui.vue3.components.button renders its <button> imperatively through ui.buttons and
		 * forwards no aria-* to it, so an icon-only button can only be named on the live node.
		 */
		nameSaveButton(): void
		{
			const button = this.$refs.editRow?.querySelector('.tasks-time-tracking-list-item-edit-save');
			if (!button)
			{
				return;
			}

			Dom.attr(button, 'aria-label', this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_SAVE_ARIA_LABEL'));
		},
		handleCalendarKeydown(event: KeyboardEvent): void
		{
			if (!OPEN_KEYS.includes(event.key))
			{
				return;
			}

			// The open picker runs its own arrow navigation, so ArrowDown has nothing to move
			// here: cancelling the page default would leave the key doing nothing at all.
			if (this.isCalendarShown && event.key === 'ArrowDown')
			{
				return;
			}

			event.preventDefault();
			this.isCalendarShown = !this.isCalendarShown;
		},
		handleWindowKeyUp(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape' || !this.isCalendarShown)
			{
				return;
			}

			event.stopImmediatePropagation();
			this.isCalendarShown = false;
		},
		createDatePicker(): DatePicker
		{
			const selectedDateTs = this.localCreatedAt ? this.localCreatedAt.getTime() : null;

			return new DatePicker({
				popupOptions: {
					id: this.calendarPopupId,
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
		<div class="tasks-time-tracking-list-row" data-testid="tasks-time-tracking-list-item-edit">
			<div class="tasks-time-tracking-list-item-edit">
				<div ref="editRow" class="tasks-time-tracking-list-item-edit-time">
					<BInput
						ref="calendarInput"
						class="tasks-time-tracking-list-item-edit-time-calendar"
						:modelValue="formatDate(localCreatedAt)"
						:design="InputDesign.LightGrey"
						clickable
						:label="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_DATE')"
						:ariaLabel="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_DATE')"
						data-testid="tasks-time-tracking-date-input"
						@click="isCalendarShown = !isCalendarShown"
						@keydown="handleCalendarKeydown"
					/>
					<BInput
						v-model="hours"
						class="tasks-time-tracking-list-item-edit-time-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_HOUR')"
						:ariaLabel="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_HOUR')"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_INPUT_H')"
						data-testid="task-time-tracking-edit-hours-input"
						active
					/>
					<BInput
						v-model="minutes"
						class="tasks-time-tracking-list-item-edit-time-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_MINUTES')"
						:ariaLabel="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_MINUTES')"
						data-testid="tasks-time-tracking-minutes-input"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_INPUT_M')"
					/>
					<UiButton
						class="tasks-time-tracking-list-item-edit-save"
						:leftIcon="Outline.CHECK_L"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.SMALL"
						@click="save"
					/>
					<button
						type="button"
						class="tasks-time-tracking-list-item-edit-close"
						:aria-label="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_CANCEL_ARIA_LABEL')"
						data-testid="tasks-time-tracking-cancel-btn"
						@click="$emit('cancel')"
					>
						<BIcon
							:name="Outline.CROSS_L"
							hoverable
							class="tasks-time-tracking-list-item-edit-close-icon"
							aria-hidden="true"
						/>
					</button>
				</div>
				<div class="tasks-time-tracking-list-item-edit-text">
					<BInput
						v-model="text"
						:ariaLabel="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_TEXT_ARIA_LABEL')"
						:placeholder="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ITEM_EDIT_TEXT')"
						:rowsQuantity="3"
						resize="none"
						data-testid="task-time-tracking-edit-comment-input"
					/>
				</div>
			</div>
		</div>
	`,
};
