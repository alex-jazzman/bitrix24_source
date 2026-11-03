/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core, main_date) {
	'use strict';

	const Controller = 'mail.api.scheduledmessage';
	class ScheduledMessageApi {
		#runAction;
		constructor(runAction = main_core.ajax.runAction) {
			this.#runAction = runAction;
		}
		async schedule(request) {
			const response = await this.#request('schedule', {
				...request
			});
			return response.scheduledMessage;
		}
		async list(request) {
			return this.#request('list', {
				...request
			});
		}
		async get(request) {
			const response = await this.#request('get', {
				...request
			});
			return response.scheduledMessage;
		}
		async update(request) {
			const response = await this.#request('update', {
				...request
			});
			return response.scheduledMessage;
		}
		async cancel(request) {
			return this.#request('cancel', {
				...request
			});
		}
		async retry(request) {
			const response = await this.#request('retry', {
				...request
			});
			return response.scheduledMessage;
		}
		async #request(action, data) {
			try {
				const response = await this.#runAction(`${Controller}.${action}`, {
					data
				});
				return response.data;
			} catch (error) {
				throw this.#mapError(error);
			}
		}
		#mapError(response) {
			const ajaxError = response;
			const error = ajaxError?.errors?.[0];
			const code = main_core.Type.isString(error?.code) ? error?.code : '';
			const message = main_core.Type.isString(error?.message) ? error?.message : '';
			const retryable = error?.retryable === true || error?.customData?.retryable === true;
			return Object.assign(new Error(message), {
				name: 'ScheduledMessageApiError',
				code,
				retryable
			});
		}
	}
	const scheduledMessageApi = new ScheduledMessageApi();

	const ScheduledTimePreset = Object.freeze({
		InOneHour: 'inOneHour',
		Tomorrow: 'tomorrow',
		WeekEnd: 'weekEnd',
		NextWeek: 'nextWeek',
		MonthEnd: 'monthEnd',
		Custom: 'custom'
	});
	const ScheduledTimeErrorCode = Object.freeze({
		InvalidLocalTime: 'invalid_local_time',
		PastTime: 'past_time'
	});
	const MinuteMilliseconds = 60 * 1000;
	const HourMilliseconds = 60 * MinuteMilliseconds;
	const DayMilliseconds = 24 * HourMilliseconds;
	const TodayHour = 18;
	const TomorrowHour = 9;
	const NextWeekHour = 9;
	function toAbsoluteScheduledTime(localDateTime, timezoneId) {
		const normalized = normalizeLocalDateTime(localDateTime);
		const candidates = resolveInstantCandidates(normalized, timezoneId);
		if (candidates.length === 0) {
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The local time does not exist in the selected timezone.');
		}
		return createAbsoluteScheduledTime(candidates[0], timezoneId);
	}
	function resolveScheduledTimePreset(preset, timezoneId, options = {}) {
		const now = options.now ?? new Date();
		if (!main_core.Type.isDate(now) || !main_core.Type.isNumber(now.getTime())) {
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The current time is invalid.');
		}
		if (preset === ScheduledTimePreset.InOneHour) {
			return createAbsoluteScheduledTime(now.getTime() + HourMilliseconds, timezoneId);
		}
		if (preset === ScheduledTimePreset.Custom) {
			if (!options.selectedLocalDateTime) {
				throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'A custom local time is required.');
			}
			return ensureFuture(toAbsoluteScheduledTime(options.selectedLocalDateTime, timezoneId), now);
		}
		const localNow = getLocalDateTime(now.getTime(), timezoneId);
		if (preset === ScheduledTimePreset.Tomorrow) {
			return ensureFuture(toAbsoluteScheduledTime(addLocalDays(localNow, 1, TomorrowHour), timezoneId), now);
		}
		if (preset === ScheduledTimePreset.WeekEnd) {
			const localDay = createUtcDate(localNow).getUTCDay();
			const daysUntilFriday = (5 - localDay + 7) % 7;
			const weekEnd = toAbsoluteScheduledTime(addLocalDays(localNow, daysUntilFriday, TodayHour), timezoneId);
			return new Date(weekEnd.iso).getTime() > now.getTime() ? weekEnd : ensureFuture(toAbsoluteScheduledTime(addLocalDays(localNow, 7, TodayHour), timezoneId), now);
		}
		if (preset === ScheduledTimePreset.NextWeek) {
			const localDay = createUtcDate(localNow).getUTCDay();
			const daysUntilNextMonday = localDay === 0 ? 1 : 8 - localDay;
			return ensureFuture(toAbsoluteScheduledTime(addLocalDays(localNow, daysUntilNextMonday, NextWeekHour), timezoneId), now);
		}
		if (preset === ScheduledTimePreset.MonthEnd) {
			const lastDay = new Date(Date.UTC(localNow.year, localNow.month, 0)).getUTCDate();
			const monthEnd = toAbsoluteScheduledTime({
				...localNow,
				day: lastDay,
				hour: TodayHour,
				minute: 0,
				second: 0
			}, timezoneId);
			return new Date(monthEnd.iso).getTime() > now.getTime() ? monthEnd : ensureFuture(toAbsoluteScheduledTime({
				...addLocalDays(localNow, 1, TodayHour),
				day: new Date(Date.UTC(localNow.year, localNow.month + 1, 0)).getUTCDate()
			}, timezoneId), now);
		}
		throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'Unknown scheduled time preset.');
	}
	function formatScheduledDateTime(absoluteTime, format = main_date.DateTimeFormat.getFormat('FORMAT_DATETIME') ?? 'Y-m-d H:i:s') {
		const timestamp = Date.parse(absoluteTime);
		if (!main_core.Type.isNumber(timestamp)) {
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The absolute time is invalid.');
		}
		return main_date.DateTimeFormat.format(format, timestamp / 1000);
	}
	function formatRelativeScheduledDateTime(absoluteTime, timezoneId, now = new Date()) {
		const timestamp = Date.parse(absoluteTime);
		if (!main_core.Type.isNumber(timestamp)) {
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The absolute time is invalid.');
		}
		const timeFormat = resolveRelativeTimeFormat();
		const fullFormat = (main_date.DateTimeFormat.getFormat('FORMAT_DATETIME') ?? 'Y-m-d H:i:s').replaceAll(':s', '');
		return main_date.DateTimeFormat.format([['tomorrow', `tomorrow, ${timeFormat}`], ['today', `today, ${timeFormat}`], ['', fullFormat]], toAuthorWallClock(timestamp, timezoneId) / 1000, toAuthorWallClock(now.getTime(), timezoneId) / 1000);
	}
	function resolveRelativeTimeFormat() {
		const ampmMode = main_date.DateTimeFormat.isAmPmMode(true);
		if (ampmMode === main_date.DateTimeFormat.AM_PM_MODE.LOWER) {
			return 'g:i a';
		}
		if (ampmMode === main_date.DateTimeFormat.AM_PM_MODE.UPPER) {
			return 'g:i A';
		}
		return 'H:i';
	}
	function toAuthorWallClock(timestamp, timezoneId) {
		const localDateTime = getLocalDateTime(timestamp, timezoneId);
		return new Date(localDateTime.year, localDateTime.month - 1, localDateTime.day, localDateTime.hour, localDateTime.minute, localDateTime.second).getTime();
	}
	function ensureFuture(absoluteTime, now) {
		if (new Date(absoluteTime.iso).getTime() <= now.getTime()) {
			throw createTimeError(ScheduledTimeErrorCode.PastTime, 'The scheduled time must be in the future.');
		}
		return absoluteTime;
	}
	function normalizeLocalDateTime(localDateTime) {
		const normalized = {
			...localDateTime,
			second: localDateTime.second ?? 0
		};
		const values = [normalized.year, normalized.month, normalized.day, normalized.hour, normalized.minute, normalized.second];
		if (!values.every(value => main_core.Type.isInteger(value))) {
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The local time contains a non-integer component.');
		}
		const validationDate = createUtcDate(normalized);
		if (normalized.year < 1970 || normalized.year > 9999 || validationDate.getUTCFullYear() !== normalized.year || validationDate.getUTCMonth() + 1 !== normalized.month || validationDate.getUTCDate() !== normalized.day || validationDate.getUTCHours() !== normalized.hour || validationDate.getUTCMinutes() !== normalized.minute || validationDate.getUTCSeconds() !== normalized.second) {
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The local time contains an invalid calendar value.');
		}
		return normalized;
	}
	function resolveInstantCandidates(localDateTime, timezoneId) {
		const wallTimestamp = createUtcDate(localDateTime).getTime();
		const offsets = new Set([getTimezoneOffset(wallTimestamp - DayMilliseconds, timezoneId), getTimezoneOffset(wallTimestamp, timezoneId), getTimezoneOffset(wallTimestamp + DayMilliseconds, timezoneId)]);
		return [...offsets].map(offset => wallTimestamp - offset).filter(timestamp => isSameLocalDateTime(getLocalDateTime(timestamp, timezoneId), localDateTime)).sort((first, second) => first - second);
	}
	function getTimezoneOffset(timestamp, timezoneId) {
		const localDateTime = getLocalDateTime(timestamp, timezoneId);
		return createUtcDate(localDateTime).getTime() - timestamp;
	}
	const localDateTimeFormatters = new Map();
	function getLocalDateTimeFormatter(timezoneId) {
		const cached = localDateTimeFormatters.get(timezoneId);
		if (cached) {
			return cached;
		}
		const formatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
			timeZone: timezoneId,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hourCycle: 'h23'
		});
		localDateTimeFormatters.set(timezoneId, formatter);
		return formatter;
	}
	function getLocalDateTime(timestamp, timezoneId) {
		let year = 0;
		let month = 0;
		let day = 0;
		let hour = 0;
		let minute = 0;
		let second = 0;
		try {
			const formatter = getLocalDateTimeFormatter(timezoneId);
			formatter.formatToParts(new Date(timestamp)).forEach(part => {
				switch (part.type) {
					case 'year':
						year = Number(part.value);
						break;
					case 'month':
						month = Number(part.value);
						break;
					case 'day':
						day = Number(part.value);
						break;
					case 'hour':
						hour = Number(part.value);
						break;
					case 'minute':
						minute = Number(part.value);
						break;
					case 'second':
						second = Number(part.value);
						break;
					default:
						break;
				}
			});
		} catch {
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The timezone identifier is invalid.');
		}
		return {
			year,
			month,
			day,
			hour,
			minute,
			second
		};
	}
	function createAbsoluteScheduledTime(timestamp, timezoneId) {
		const offset = getTimezoneOffset(timestamp, timezoneId);
		return {
			iso: new Date(timestamp).toISOString(),
			timezoneLabel: `${timezoneId} (UTC${formatTimezoneOffset(offset)})`
		};
	}
	function formatTimezoneOffset(offset) {
		const sign = offset < 0 ? '-' : '+';
		const absoluteMinutes = Math.abs(Math.round(offset / 60000));
		const hours = Math.floor(absoluteMinutes / 60).toString().padStart(2, '0');
		const minutes = (absoluteMinutes % 60).toString().padStart(2, '0');
		return `${sign}${hours}:${minutes}`;
	}
	function addLocalDays(localDateTime, days, hour) {
		const date = createUtcDate({
			...localDateTime,
			hour,
			minute: 0,
			second: 0
		});
		date.setUTCDate(date.getUTCDate() + days);
		return {
			year: date.getUTCFullYear(),
			month: date.getUTCMonth() + 1,
			day: date.getUTCDate(),
			hour: date.getUTCHours(),
			minute: date.getUTCMinutes(),
			second: date.getUTCSeconds()
		};
	}
	function createUtcDate(localDateTime) {
		return new Date(Date.UTC(localDateTime.year, localDateTime.month - 1, localDateTime.day, localDateTime.hour, localDateTime.minute, localDateTime.second));
	}
	function isSameLocalDateTime(first, second) {
		return first.year === second.year && first.month === second.month && first.day === second.day && first.hour === second.hour && first.minute === second.minute && first.second === second.second;
	}
	function createTimeError(code, message) {
		return Object.assign(new RangeError(message), {
			code
		});
	}

	const ScheduledMessageErrorCode = Object.freeze({
		FeatureUnavailable: 'feature_unavailable',
		InvalidTime: 'invalid_time',
		AccessDenied: 'access_denied',
		NotFound: 'not_found',
		RevisionConflict: 'revision_conflict',
		AlreadySending: 'already_sending',
		AlreadySent: 'already_sent',
		AlreadyCancelled: 'already_cancelled',
		MailboxAccessDenied: 'mailbox_access_denied',
		RecipientLimit: 'recipient_limit',
		AttachmentLimit: 'attachment_limit',
		InvalidHeader: 'invalid_header',
		AttachmentAccessDenied: 'attachment_access_denied',
		AttachmentInvalid: 'attachment_invalid',
		AttachmentCopyFailed: 'attachment_copy_failed',
		AttachmentSizeLimit: 'attachment_size_limit',
		SaveFailed: 'save_failed',
		SendLimit: 'send_limit',
		DraftUnavailable: 'draft_unavailable',
		DraftSaveFailed: 'draft_save_failed',
		SenderUnavailable: 'sender_unavailable',
		AttachmentUnavailable: 'attachment_unavailable',
		MailboxUnavailable: 'mailbox_unavailable',
		InvalidAuthor: 'invalid_author',
		RecipientRequired: 'recipient_required',
		SendFailed: 'send_failed',
		SendException: 'send_exception'
	});

	exports.ScheduledMessageApi = ScheduledMessageApi;
	exports.ScheduledMessageErrorCode = ScheduledMessageErrorCode;
	exports.ScheduledTimeErrorCode = ScheduledTimeErrorCode;
	exports.ScheduledTimePreset = ScheduledTimePreset;
	exports.formatRelativeScheduledDateTime = formatRelativeScheduledDateTime;
	exports.formatScheduledDateTime = formatScheduledDateTime;
	exports.resolveScheduledTimePreset = resolveScheduledTimePreset;
	exports.scheduledMessageApi = scheduledMessageApi;
	exports.toAbsoluteScheduledTime = toAbsoluteScheduledTime;

})(this.BX.Mail.Client.ScheduledMessage = this.BX.Mail.Client.ScheduledMessage || {}, BX, BX.Main);
//# sourceMappingURL=scheduled-message.bundle.js.map
