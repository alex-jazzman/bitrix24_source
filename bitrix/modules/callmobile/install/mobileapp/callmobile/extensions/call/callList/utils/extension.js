/*
 * @module call/callList/utils
 */
jn.define('call/callList/utils', (require, exports, module) => {
	const { DateFormatter } = require('im/messenger/lib/date-formatter');

	function parseStatusTime(raw)
	{
		if (!raw)
		{
			return 0;
		}

		const ms = Date.parse(raw);
		if (Number.isFinite(ms))
		{
			return Math.floor(ms / 1000);
		}

		const match = String(raw).trim().match(
			/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
		);
		if (match)
		{
			const day = Number(match[1]);
			const month = Number(match[2]) - 1;
			const year = Number(match[3]);
			const hour = Number(match[4]);
			const minute = Number(match[5]);
			const second = Number(match[6] || 0);
			const dateTime = new Date(year, month, day, hour, minute, second);

			return Math.floor(dateTime.getTime() / 1000);
		}

		return 0;
	}

	function formatDuration(seconds)
	{
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		const parts = [];
		const HOURS_SHORT = BX.message('MOBILEAPP_CALL_LIST_TIME_HOURS_SHORT');
		const MINUTES_SHORT = BX.message('MOBILEAPP_CALL_LIST_TIME_MINUTES_SHORT');
		const SECONDS_SHORT = BX.message('MOBILEAPP_CALL_LIST_TIME_SECONDS_SHORT');
		if (hours > 0)
		{
			parts.push(`${hours} ${HOURS_SHORT}`);
		}

		if (minutes > 0)
		{
			parts.push(`${minutes} ${MINUTES_SHORT}`);
		}

		if (secs > 0)
		{
			parts.push(`${secs} ${SECONDS_SHORT}`);
		}

		return parts.join(' ');
	}

	function formatTime(ts)
	{
		const date = new Date(ts * 1000);

		return DateFormatter.getRecentFormat(date);
	}

	function restCall(method, params)
	{
		return new Promise((resolve, reject) => {
			try
			{
				BX.rest.callMethod(method, params, (result) => {
					if (result.error())
					{
						reject(result.error());
					}
					else
					{
						const data = result.data();
						resolve(data);
					}
				});
			}
			catch (error)
			{
				reject(error);
			}
		});
	}

	function normalizeUserAvatarPath(rawAvatar)
	{
		const input = String(rawAvatar || '').trim();
		if (!input)
		{
			return '';
		}

		const lower = input.toLowerCase();
		if (lower.endsWith('blank.gif') || lower.endsWith('blank.svg'))
		{
			return '';
		}

		if (input.startsWith('/'))
		{
			return input.split(' ').join('%20');
		}

		const withoutProto = input.replace(/^(https?:\/\/)+/i, '');
		const idx = withoutProto.indexOf('/');
		const path = (idx >= 0)
			? withoutProto.slice(idx)
			: (withoutProto.startsWith('/')
				? withoutProto
				: `/${withoutProto}`
			);

		return path.split(' ').join('%20');
	}

	module.exports = {
		parseStatusTime,
		formatDuration,
		formatTime,
		restCall,
		normalizeUserAvatarPath,
	};
});
