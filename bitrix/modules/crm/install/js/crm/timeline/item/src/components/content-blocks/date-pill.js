import { DatetimeConverter } from 'crm.timeline.tools';
import { Runtime, Type } from 'main.core';
import { DateTimeFormat, Timezone } from 'main.date';
import { UI } from 'ui.notification';
import { Action } from '../../action';

export const DatePillColor = Object.freeze({
	DEFAULT: 'default',
	WARNING: 'warning',
	NONE: 'none',
});

export const PillStyle = Object.freeze({
	DEFAULT: 'pill',
	INLINE_GROUP: 'pill-inline-group',
});

export default {
	props: {
		value: Number,
		withTime: Boolean,
		duration: {
			type: Number,
			required: false,
			default: null,
		},
		backgroundColor: {
			type: String,
			required: false,
			default: DatePillColor.DEFAULT,
			validator(value: string) {
				return Object.values(DatePillColor).includes(value);
			},
		},
		action: Object | null,
		styleValue: String,
		canChangeDeadline: {
			type: Boolean,
			required: false,
			default: true,
		},
	},
	inject: ['isReadOnly'],
	data(): Object
	{
		return {
			currentTimestamp: this.value,
			initialTimestamp: this.value,
			// deadline writes are serialized on this chain, so a later pick never starts before the
			// previous request has settled and committed its authoritative value
			requestChain: Promise.resolve(),
			// bumped by a push update; invalidates own in-flight writes, since the push is authoritative
			pushGeneration: 0,
		};
	},
	computed: {
		className(): []
		{
			return [
				'crm-timeline__date-pill',
				`--color-${this.backgroundColor}`,
				{
					'--readonly': this.isPillReadonly,
				},
				{
					'--inline-group': this.styleValue === PillStyle.INLINE_GROUP,
				},
			];
		},
		formattedDate(): string
		{
			if (!this.currentTimestamp)
			{
				return null;
			}

			const converterOptions = {
				delimiter: ', ',
				withDayOfWeek: true,
				withFullMonth: true,
			};

			const converter = this.getDatetimeConverter();
			const dateFrom = converter.toDatetimeString(converterOptions);

			if (!Type.isNumber(this.duration) || this.duration <= 0)
			{
				return dateFrom;
			}

			const converterWithDuration = this.getDatetimeConverterWithDuration();
			const isSameDay = converter.toDateString() === converterWithDuration.toDateString();

			const dateTo = isSameDay
				? converterWithDuration.toTimeString()
				: converterWithDuration.toDatetimeString(converterOptions)
			;

			return `${dateFrom} - ${dateTo}`;
		},
		currentDateInSiteFormat(): ?string
		{
			return this.formatTimestampForSite(this.currentTimestamp);
		},

		calendarParams(): Object {
			return {
				value: this.currentDateInSiteFormat,
				bTime: this.withTime,
				bHideTime: !this.withTime,
				bSetFocus: false,
			}
		},

		isPillReadonly(): boolean {
			return this.isReadOnly || !this.action;
		},
	},
	watch: {
		value(newDate): void // update date from push
		{
			this.initialTimestamp = newDate;
			this.currentTimestamp = newDate;
			// the push carries the authoritative date: drop the outcome of any own in-flight write
			this.pushGeneration += 1;
		}
	},
	methods: {
		openCalendar(event: PointerEvent): void
		{
			if (this.isPillReadonly)
			{
				return;
			}

			if (!this.canChangeDeadline)
			{
				UI.Notification.Center.notify({
					content: this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_DATE_PILL_CALENDAR_EVENT_ACCESS_DENIED'),
					autoHideDelay: 5000,
				});

				return;
			}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.calendar({
				node: event.target,
				callback_after: (newDate: Date) => {
					// we assume that user selected time in his timezone
					this.currentTimestamp = Timezone.UserTime.toUTCTimestamp(newDate);

					this.executeAction();
				},
				...this.calendarParams,
			});
		},
		executeAction(): void
		{
			if (!this.action)
			{
				return;
			}

			if (this.currentTimestamp === this.initialTimestamp)
			{
				return;
			}

			const attemptedTimestamp = this.currentTimestamp;
			const generation = this.pushGeneration;

			// serialize writes: a later pick waits for the previous request to settle, so a successful
			// write always commits its timestamp before the next one can revert on error. Without this,
			// an older success followed by a newer failure would revert the UI to a stale value while
			// the server already holds the older date.
			this.requestChain = this.requestChain.then(
				() => this.performDeadlineChange(attemptedTimestamp, generation),
			);
		},
		performDeadlineChange(attemptedTimestamp: number, generation: number): Promise
		{
			// a newer pick already committed this exact value, or a push replaced it: nothing to send
			if (!this.action || attemptedTimestamp === this.initialTimestamp)
			{
				return Promise.resolve();
			}

			// to avoid unintended props mutation
			const actionDescription = Runtime.clone(this.action);

			actionDescription.actionParams ??= {};
			actionDescription.actionParams.value = this.formatTimestampForSite(attemptedTimestamp);
			actionDescription.actionParams.valueTs = attemptedTimestamp;

			// a push update between scheduling and settling makes the push authoritative: neither commit
			// nor revert this write's outcome
			const isStaleRequest = () => this.pushGeneration !== generation;

			// revert to the last committed timestamp, unless the user has already picked a newer one;
			// reading initialTimestamp here (not a value captured before the request) keeps overlapping
			// requests from reverting past the last actually committed timestamp
			const revertShownDate = () => {
				if (this.currentTimestamp === attemptedTimestamp)
				{
					this.currentTimestamp = this.initialTimestamp;
				}
			};

			const action = new Action(actionDescription);

			return action.execute(this).then((response: ?Object) => {
				if (isStaleRequest())
				{
					return;
				}

				// backend rejected the change (e.g. no rights on the linked calendar event)
				if (Type.isArrayFilled(response?.errors))
				{
					revertShownDate();

					return;
				}

				// the server now holds this value; record it as the last committed one even if a newer
				// pick already moved the shown date, so a later failing write reverts to THIS date
				this.initialTimestamp = attemptedTimestamp;

				this.$emit('onChange', this.initialTimestamp);
			}).catch(() => {
				if (isStaleRequest())
				{
					return;
				}

				// a rejected action promise is treated as a rejection as well
				revertShownDate();
			});
		},
		formatTimestampForSite(timestamp: ?number): ?string
		{
			return DateTimeFormat.format(
				this.withTime
					? DatetimeConverter.getSiteDateTimeFormat()
					: DatetimeConverter.getSiteDateFormat(),
				DatetimeConverter.createFromServerTimestamp(timestamp).toUserTime().getValue(),
			);
		},
		getDatetimeConverter(): DatetimeConverter
		{
			return (DatetimeConverter.createFromServerTimestamp(this.currentTimestamp)).toUserTime();
		},
		getDatetimeConverterWithDuration(): DatetimeConverter
		{
			return (DatetimeConverter.createFromServerTimestamp(this.currentTimestamp + this.duration)).toUserTime();
		},
	},
	template: `
		<span
			:class="className"
			@click="openCalendar"
		>
			<span>
				{{ formattedDate }}
			</span>
			<span class="crm-timeline__date-pill_caret"></span>
		</span>`
};
