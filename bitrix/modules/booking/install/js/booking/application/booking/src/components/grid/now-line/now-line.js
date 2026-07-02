import { Dom } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { mapGetters } from 'ui.vue3.vuex';

import { Model, Grid } from 'booking.const';
import './now-line.css';

// @vue/component
export const NowLine = {
	name: 'NowLine',
	data(): Object
	{
		return {
			visible: true,
		};
	},
	created(): void
	{
		this.intervalId = null;
	},
	computed: mapGetters({
		zoom: `${Model.Interface}/zoom`,
		selectedDateTs: `${Model.Interface}/selectedDateTs`,
		offHoursExpanded: `${Model.Interface}/offHoursExpanded`,
		fromHour: `${Model.Interface}/fromHour`,
		toHour: `${Model.Interface}/toHour`,
		offset: `${Model.Interface}/offset`,
		isWeekMode: `${Model.Interface}/isWeekMode`,
		selectedFirstDayPeriodTs: `${Model.Interface}/selectedFirstDayPeriodTs`,
		scroll: `${Model.Interface}/scroll`,
	}),
	watch: {
		scroll(value): void
		{
			this.updateNowLine();
		},
		selectedDateTs(): void
		{
			this.updateNowLine();
		},
		zoom(): void
		{
			this.updateNowLine();
		},
		offHoursExpanded(offHoursExpanded: boolean): void
		{
			if (this.isWeekMode)
			{
				return;
			}

			const now = new Date();
			const nowMinutes = now.getHours() * 60 + now.getMinutes();
			if (nowMinutes < this.toHour * 60)
			{
				return;
			}

			this.setVisible(!offHoursExpanded);
			setTimeout(() => this.setVisible(true), 200);
		},
	},
	mounted(): void
	{
		this.updateNowLine();
		this.intervalId = setInterval(() => this.updateNowLine(), 1000);
	},
	beforeUnmount(): void
	{
		if (this.intervalId)
		{
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	},
	methods: {
		setVisible(visible: boolean): void
		{
			this.visible = visible;
			this.updateNowLine();
		},
		updateNowLine(): void
		{
			if (this.isWeekMode)
			{
				this.updateWeekNowLine();
			}
			else
			{
				this.updateDayNowLine();
			}
		},
		updateDayNowLine(): void
		{
			const now = new Date(Date.now() + this.offset);

			const hourHeight = 50 * this.zoom;
			const fromMinutes = this.fromHour * 60;
			const nowMinutes = now.getHours() * 60 + now.getMinutes();
			const toHour = this.offHoursExpanded ? 24 : this.toHour;
			const toMinutes = Math.min(toHour * 60 + 21, nowMinutes);
			const top = (toMinutes - fromMinutes) * (hourHeight / 60);
			Dom.style(this.$refs.nowLine, 'top', `${top}px`);
			Dom.style(this.$refs.nowLine, 'left', '');

			this.updateTimeText(now);
			this.updateDayVisibility(now);
		},
		updateWeekNowLine(): void
		{
			const now = new Date(Date.now() + this.offset);

			const weekStart = new Date(this.selectedFirstDayPeriodTs + this.offset);
			const weekStartMidnight = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
			const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const diffDays = Math.round((nowMidnight - weekStartMidnight) / (24 * 60 * 60 * 1000));

			const isInWeek = diffDays >= 0 && diffDays < 7;

			if (!isInWeek || !this.visible)
			{
				Dom.style(this.$refs.nowLine, 'display', 'none');

				return;
			}

			const hourOffset = (now.getHours() + now.getMinutes() / 60) * Grid.SizeElement.WeekHourWidth;
			const left = diffDays * Grid.SizeElement.WeekCellWidth + hourOffset;
			const top = Grid.SizeElement.WeekDaysPanelHeight + this.scroll;

			Dom.style(this.$refs.nowLine, 'top', `${top}px`);
			Dom.style(this.$refs.nowLine, 'left', `${left}px`);
			Dom.style(this.$refs.nowLine, 'display', '');

			this.updateTimeText(now);
		},
		updateTimeText(now: Date): void
		{
			const timeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const timeFormatted = DateTimeFormat.format(timeFormat, now.getTime() / 1000);
			if (timeFormatted !== this.$refs.nowText.innerText)
			{
				this.$refs.nowText.innerText = timeFormatted;
			}
		},
		updateDayVisibility(now: Date): void
		{
			const date = new Date(this.selectedDateTs + this.offset);

			const visible = this.visible
				&& Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
				=== Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
			;
			Dom.style(this.$refs.nowLine, 'display', visible ? '' : 'none');
		},
	},
	template: `
		<div class="booking-booking-grid-now-line" ref="nowLine">
			<div class="booking-booking-grid-now-line-text" ref="nowText"></div>
		</div>
	`,
};
