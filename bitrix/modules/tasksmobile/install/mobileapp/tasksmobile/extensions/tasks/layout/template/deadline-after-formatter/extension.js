/**
 * @module tasks/layout/template/deadline-after-formatter
 */
jn.define('tasks/layout/template/deadline-after-formatter', (require, exports, module) => {
	const { TimeAgoFormat } = require('layout/ui/friendly-date/time-ago-format');
	const { Moment } = require('utils/date');

	const timeAgoTextBuilder = new TimeAgoFormat({
		futureAllowed: true,
	});

	const formatTemplateDeadlineAfter = (seconds, emptyValue = '') => {
		const value = Number(seconds || 0);
		if (value <= 0)
		{
			return emptyValue;
		}

		const now = new Moment();
		const nowMs = now.date.getTime();

		const minute = 60;
		const hour = 60 * minute;
		const day = 24 * hour;

		if (value < minute)
		{
			const amount = Math.max(1, Math.ceil(value));
			const moment = new Moment(nowMs + amount * 1000).setNow(now);

			return timeAgoTextBuilder.formatSeconds(moment);
		}

		if (value < hour)
		{
			const amount = Math.max(1, Math.ceil(value / minute));
			const moment = new Moment(nowMs + amount * minute * 1000).setNow(now);

			return timeAgoTextBuilder.formatMinutes(moment);
		}

		if (value < day)
		{
			const amount = Math.max(1, Math.ceil(value / hour));
			const moment = new Moment(nowMs + amount * hour * 1000).setNow(now);

			return timeAgoTextBuilder.formatHours(moment);
		}

		const amount = Math.max(1, Math.ceil(value / day));
		const moment = new Moment(nowMs + amount * day * 1000).setNow(now);

		return timeAgoTextBuilder.formatDays(moment);
	};

	module.exports = {
		formatTemplateDeadlineAfter,
	};
});
