/**
 * @module timeman/work-days/utils
 */
jn.define('timeman/work-days/utils', (require, exports, module) => {
	const { Type } = require('type');
	const { DAY_TYPES, getDayTypeByAbsence } = require('timeman/work-days/enums');

	function toDateKey(date)
	{
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');

		return `${y}-${m}-${d}`;
	}

	/**
	 * @param {Date} startDate
	 * @param {Date} endDate
	 * @param {Array} records
	 * @param {Array} absences
	 * @param {Array} [reports]
	 * @param {Date|null} [startBoundDate]
	 * @returns {DayMap}
	 */
	function buildDayMap(startDate, endDate, records, absences, reports = [], startBoundDate = null)
	{
		const recordsByDate = buildRecordsMap(records);
		const absencesByDate = buildAbsencesMap(absences, startDate, endDate);
		const reportsByDate = buildReportsMap(reports, records);

		const startKey = toDateKey(startDate);
		const endKey = toDateKey(endDate);
		const inRange = (dateKey) => dateKey >= startKey && dateKey <= endKey;
		const hasDataInRange = (
			absencesByDate.size > 0
			|| [...recordsByDate.keys()].some(inRange)
			|| [...reportsByDate.keys()].some(inRange)
		);

		if (!hasDataInRange)
		{
			return new Map();
		}

		const dayMap = new Map();
		let current = new Date(startDate);
		const todayKey = toDateKey(new Date());
		const startBoundKey = startBoundDate ? toDateKey(startBoundDate) : null;

		while (current <= endDate)
		{
			const dateKey = toDateKey(current);
			const dayRecords = recordsByDate.get(dateKey) || [];
			const absenceType = absencesByDate.get(dateKey);
			const dayReports = reportsByDate.get(dateKey) || [];

			let dayType = null;
			if (dayRecords.length > 0)
			{
				dayType = DAY_TYPES.WORK;
			}
			else if (absenceType)
			{
				dayType = absenceType;
			}
			else if (dateKey < todayKey && (!startBoundKey || dateKey >= startBoundKey))
			{
				dayType = DAY_TYPES.DAY_OFF;
			}

			dayMap.set(dateKey, {
				dayType,
				records: dayRecords,
				reports: dayReports,
			});

			const next = new Date(current);
			next.setDate(next.getDate() + 1);
			current = next;
		}

		return dayMap;
	}

	function buildRecordsMap(records)
	{
		const map = new Map();

		if (Type.isArrayFilled(records))
		{
			records.forEach((record) => {
				if (!record.startTime)
				{
					return;
				}

				const dateKey = toDateKey(new Date(record.startTime * 1000));
				if (!map.has(dateKey))
				{
					map.set(dateKey, []);
				}
				map.get(dateKey).push(record);
			});
		}

		return map;
	}

	function buildReportsMap(reports, records)
	{
		const map = new Map();

		if (!Type.isArrayFilled(reports))
		{
			return map;
		}

		const dateByRecordId = new Map();
		if (Type.isArrayFilled(records))
		{
			records.forEach((record) => {
				if (record?.id && record.startTime)
				{
					dateByRecordId.set(record.id, toDateKey(new Date(record.startTime * 1000)));
				}
			});
		}

		reports.forEach((report) => {
			const dateKey = report?.recordId ? dateByRecordId.get(report.recordId) : null;
			if (!dateKey)
			{
				return;
			}

			if (!map.has(dateKey))
			{
				map.set(dateKey, []);
			}
			map.get(dateKey).push(report);
		});

		return map;
	}

	function buildAbsencesMap(absences, startDate, endDate)
	{
		const map = new Map();

		if (Type.isArrayFilled(absences))
		{
			absences.forEach((absence) => {
				const absenceType = getDayTypeByAbsence(absence.type || absence.typeXmlId);
				const from = parseDate(absence.dateFrom);
				const to = parseDate(absence.dateTo);
				if (!from || !to)
				{
					return;
				}

				let day = new Date(from);

				while (day <= to && day <= endDate)
				{
					if (day >= startDate)
					{
						const dateKey = toDateKey(day);
						map.set(dateKey, absenceType);
					}

					const next = new Date(day);
					next.setDate(next.getDate() + 1);
					day = next;
				}
			});
		}

		return map;
	}

	function parseDate(dateString)
	{
		if (!Type.isStringFilled(dateString))
		{
			return null;
		}

		const [datePart, timePart] = dateString.split(' ');
		const dateParts = datePart.split('.');
		if (dateParts.length !== 3)
		{
			return null;
		}

		const [day, month, year] = dateParts;
		const date = new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`);

		return Number.isNaN(date.getTime()) ? null : date;
	}

	/**
	 * Returns the 42-day (6x7) calendar grid window for the given month start date.
	 * The grid starts on the Monday of the week containing the 1st of the month
	 * (firstWeekday=2, i.e. week starts on Monday).
	 *
	 * @param {Date} monthStartDate - Local midnight of the 1st day of the month
	 * @returns {{ start: Date, end: Date }}
	 */
	function getCalendarGridRange(monthStartDate)
	{
		const dayOfWeek = monthStartDate.getDay();
		const mondayOffset = (dayOfWeek + 6) % 7;

		const start = new Date(monthStartDate);
		start.setDate(start.getDate() - mondayOffset);
		start.setHours(0, 0, 0, 0);

		const end = new Date(start);
		end.setDate(end.getDate() + 41);
		end.setHours(23, 59, 59, 999);

		return { start, end };
	}

	module.exports = { buildDayMap, getCalendarGridRange };
});
