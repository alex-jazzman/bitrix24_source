import { Dom } from 'main.core';
import { AirButtonStyle, ButtonSize, SplitButton, type SplitButtonOptions } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { defineComponent, markRaw } from 'ui.vue3';

import { Phrase, SendControlTestId } from '../../const';
import { loc } from '../../lib/loc/loc';
import {
	isRecipientsTotalLimitExceeded,
	isSelectedSenderMigrationActive,
	useComposeState,
} from '../../model/compose/compose';
import { type DatePickerClass, loadDatePicker, SchedulePopup } from '../schedule-popup/schedule-popup';

import './send-split-button.css';

const TestId = Object.freeze({
	control: 'mail-compose-send-split',
	send: SendControlTestId,
	schedule: 'mail-compose-schedule-action',
});

const ScheduleIconSize = 20;

/** Own class on the right half: the form styles must not rely on the internal classes of `ui.buttons`. */
const ScheduleClassName = 'mail-compose-send-split__schedule';

/**
 * The split has no Vue wrapper: the Vue button declares `clickSecondary` but never emits it. The instance
 * is a vanilla one, kept out of the reactive state and rendered into its own node.
 *
 * Scheduling itself is implemented by a separate task: the right half only opens the popup.
 */
// @vue/component
export const SendSplitButton = defineComponent({
	name: 'MailComposeSendSplitButton',

	components: {
		SchedulePopup,
	},

	emits: ['send'],

	setup()
	{
		return {
			state: useComposeState(),
			testId: TestId,
		};
	},

	data()
	{
		return {
			// Outside the reactive state: a proxy would break access to the private fields of the instance.
			control: null as SplitButton | null,
			isScheduleShown: false,
			datePicker: null as DatePickerClass | null,
		};
	},

	computed: {
		isSending(): boolean
		{
			return this.state.isSending;
		},

		isRecipientsLimitExceeded(): boolean
		{
			return isRecipientsTotalLimitExceeded(this.state);
		},

		isSendDisabled(): boolean
		{
			return this.isSending
				|| isSelectedSenderMigrationActive(this.state)
				|| this.isRecipientsLimitExceeded
			;
		},

		/** The popup binds to the right half, not to the whole split. */
		scheduleNode(): HTMLElement | null
		{
			return this.control?.getMenuButton().getContainer() ?? null;
		},
	},

	watch: {
		isSending(): void
		{
			this.syncSending();
		},

		isSendDisabled(): void
		{
			this.syncSending();
		},

		isRecipientsLimitExceeded(): void
		{
			this.syncSending();
		},
	},

	mounted(): void
	{
		this.createControl();
		this.syncSending();
	},

	beforeUnmount(): void
	{
		this.destroyControl();
	},

	methods: {
		createControl(): void
		{
			// `ui.buttons` types the collapsed icon as required though a button works without it, hence Partial.
			const options: Partial<SplitButtonOptions> = {
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				size: ButtonSize.MEDIUM,
				mainButton: {
					text: loc(Phrase.SendButton),
					dataset: { testid: TestId.send },
					// The screen sits inside the server form of the panel, and a half without `type` sends it.
					props: {
						type: 'button',
					},
					// `ui.buttons` types a click handler as returning an object.
					onclick: (): {} => {
						this.handleSend();

						return {};
					},
				},
				menuButton: {
					className: ScheduleClassName,
					dataset: { testid: TestId.schedule },
					// Icon-only half, so the name is set for screen readers.
					props: {
						type: 'button',
						'aria-label': loc(Phrase.ScheduleButton),
						'aria-haspopup': 'dialog',
						'aria-expanded': 'false',
					},
					onclick: (): {} => {
						this.handleSchedule();

						return {};
					},
				},
			};

			const control = markRaw(new SplitButton(options as SplitButtonOptions));

			this.control = control;
			control.renderTo(this.$refs.slot as HTMLElement);
			this.renderScheduleIcon();
		},

		/**
		 * `ui.buttons` has no option for the icon of the right half, so the icon is rendered into it directly;
		 * the chevron the split draws there is hidden in `send-split-button.css`.
		 */
		renderScheduleIcon(): void
		{
			const half = this.scheduleNode;

			if (half)
			{
				new Icon({
					icon: Outline.CALENDAR,
					size: ScheduleIconSize,
					color: 'var(--ui-btn-color)',
				}).renderTo(half);
			}
		},

		/** `setWaiting()` marks the request state; `setDisabled()` applies the visual disabled state. */
		syncSending(): void
		{
			const control = this.control;

			if (!control)
			{
				return;
			}

			if (this.isSending)
			{
				control.setDisabled(false);
				control.setWaiting(true);
			}
			else
			{
				control.setWaiting(false);
				control.setDisabled(this.isSendDisabled);
			}

			// `setProps` of a half takes strings only, so the flag is written as an attribute.
			Dom.attr(control.getMainButton().getContainer(), 'disabled', this.isSendDisabled ? true : null);
			Dom.attr(control.getMenuButton().getContainer(), 'disabled', this.isSendDisabled ? true : null);
			const title = isSelectedSenderMigrationActive(this.state)
				? loc('MAIL_MIGRATION_SEND_UNAVAILABLE')
				: null
			;
			Dom.attr(control.getMainButton().getContainer(), 'title', title);
			Dom.attr(control.getMenuButton().getContainer(), 'title', title);
		},

		/** `ui.buttons` has no destructor, so the instance goes away with its node. */
		destroyControl(): void
		{
			Dom.remove(this.control?.getContainer());
			this.control = null;
		},

		handleSend(): void
		{
			if (this.isSendDisabled)
			{
				return;
			}

			this.$emit('send');
		},

		/**
		 * The calendar of the popup comes with an extension of its own, which is asked for here: the popup is
		 * mounted with the class already in hand and draws the calendar at once. A load that failed leaves the
		 * popup closed — a card without the calendar has nothing to offer.
		 */
		handleSchedule(): void
		{
			if (this.isSendDisabled)
			{
				return;
			}

			if (this.isScheduleShown)
			{
				this.handleScheduleClose();

				return;
			}

			void loadDatePicker().then(
				(datePicker: DatePickerClass): void => {
					this.datePicker = datePicker;
					this.isScheduleShown = true;
					this.syncScheduleState();
				},
				(): void => {},
			);
		},

		handleScheduleClose(): void
		{
			this.isScheduleShown = false;
			this.syncScheduleState();
		},

		/** Keeps `aria-expanded` of the right half in step with the popup. */
		syncScheduleState(): void
		{
			this.control?.getMenuButton().setProps({ 'aria-expanded': this.isScheduleShown ? 'true' : 'false' });
		},
	},

	template: `
		<div ref="slot" class="mail-compose-send-split" :data-testid="testId.control"></div>
		<SchedulePopup
			v-if="isScheduleShown && scheduleNode && datePicker"
			:bindElement="scheduleNode"
			:datePicker="datePicker"
			@close="handleScheduleClose"
		/>
	`,
});
