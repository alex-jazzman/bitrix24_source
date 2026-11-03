import { BX } from './internal/global';
import { util } from './util';

/**
 * Date parsing, formatting and the name template (MOD-01).
 *
 * No shared state; the group is held together by the formats it reads out of `BX.message` and by
 * `parseDate` calling `getNumMonth`.
 *
 * FIX-01 #2 is closed here: `getNumMonth` wrote its loop counter into an implicit global, and in
 * the strict mode a module runs under that is a ReferenceError rather than a leak - the function
 * did not work at all in the test bundle before this. FIX-01 #3 turned out not to apply:
 * `parseDate` declares its `i` in the `var` list further down, so the loop above it only depends
 * on hoisting, and nothing has to change. With that, AC-015 is closed.
 */

export function isAmPmMode(returnConst?: any): any
{
	if (returnConst === true)
	{
		return BX.message.AMPM_MODE;
	}

	// a property of the message function, not a call to it
	return BX.message.AMPM_MODE !== false;
}

export function formatDate(date?: any, format?: any): string
{
	date = date || new Date();

	const bTime = date.getHours() || date.getMinutes() || date.getSeconds();
	const str = format
		? format
		: (bTime ? BX.message('FORMAT_DATETIME') : BX.message('FORMAT_DATE'));

	// the order matters: MMMM before MM, or the shorter marker would eat half of the longer one.
	// Both produce the same two-digit number - no month name is ever substituted.
	return str.replace(/YYYY/ig, date.getFullYear())
		.replace(/MMMM/ig, util.str_pad_left((date.getMonth() + 1).toString(), 2, '0'))
		.replace(/MM/ig, util.str_pad_left((date.getMonth() + 1).toString(), 2, '0'))
		.replace(/DD/ig, util.str_pad_left(date.getDate().toString(), 2, '0'))
		.replace(/HH/ig, util.str_pad_left(date.getHours().toString(), 2, '0'))
		.replace(/MI/ig, util.str_pad_left(date.getMinutes().toString(), 2, '0'))
		.replace(/SS/ig, util.str_pad_left(date.getSeconds().toString(), 2, '0'));
}

export function formatName(user?: any, template?: any, login?: any): string
{
	user = user || {};
	template = (template || '');
	const replacement: Record<string, string> = {
		TITLE: (user.TITLE || ''),
		NAME: (user.NAME || ''),
		LAST_NAME: (user.LAST_NAME || ''),
		SECOND_NAME: (user.SECOND_NAME || ''),
		LOGIN: (user.LOGIN || ''),
		NAME_SHORT: user.NAME ? `${user.NAME.substr(0, 1)}.` : '',
		LAST_NAME_SHORT: user.LAST_NAME ? `${user.LAST_NAME.substr(0, 1)}.` : '',
		SECOND_NAME_SHORT: user.SECOND_NAME ? `${user.SECOND_NAME.substr(0, 1)}.` : '',
		EMAIL: (user.EMAIL || ''),
		ID: (user.ID || ''),
		NOBR: '',
		'/NOBR': '',
	};
	let result = template;

	for (const ii in replacement)
	{
		if (Object.prototype.hasOwnProperty.call(replacement, ii))
		{
			// no global flag: only the first occurrence of each placeholder is replaced
			result = result.replace(`#${ii}#`, replacement[ii]);
		}
	}
	result = result.replace(/(\s+)/gi, ' ').trim();
	if (result == '')
	{
		result = (login == 'Y' ? replacement.LOGIN : '');
		result = (result == '' ? 'Noname' : result);
	}

	return result;
}

export function getNumMonth(month: any): any
{
	const wordMonthCut = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
	const wordMonth = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

	const q = month.toUpperCase();
	// FIX-01 #2: the counter was implicit; in the strict mode of a module that is a ReferenceError
	let i;
	for (i = 1; i <= 12; i++)
	{
		if (q == BX.message(`MON_${i}`).toUpperCase() || q == BX.message(`MONTH_${i}`).toUpperCase() || q == wordMonthCut[i - 1].toUpperCase() || q == wordMonth[i - 1].toUpperCase())
		{
			return i;
		}
	}

	// no match hands the argument back, not a null and not a zero
	return month;
}

export function parseDate(str: any, bUTC?: any, dateFormat?: any, formatDatetime?: any): any
{
	if (BX.type.isNotEmptyString(str))
	{
		if (!dateFormat)
		{
			dateFormat = BX.message('FORMAT_DATE');
		}

		if (!formatDatetime)
		{
			formatDatetime = BX.message('FORMAT_DATETIME');
		}

		let i;
		let cnt;

		let regMonths = '';
		for (i = 1; i <= 12; i++)
		{
			regMonths = `${regMonths}|${BX.message(`MON_${i}`)}`;
		}

		const expr = new RegExp(`([0-9]+|[a-z]+${regMonths})`, 'ig');
		const aDate = str.match(expr);
		let aFormat = dateFormat.match(/(DD|MI|MMMM|MM|M|YYYY)/ig);
		const aDateArgs: any[] = [];
		const aFormatArgs: any[] = [];
		const aResult: Record<string, any> = {};

		if (!aDate)
		{
			return null;
		}

		if (aDate.length > aFormat.length)
		{
			aFormat = formatDatetime.match(/(DD|MI|MMMM|MM|M|YYYY|HH|H|SS|TT|T|GG|G)/ig);
		}

		for (i = 0, cnt = aDate.length; i < cnt; i++)
		{
			if (util.trim(aDate[i]) != '')
			{
				aDateArgs[aDateArgs.length] = aDate[i];
			}
		}

		for (i = 0, cnt = aFormat.length; i < cnt; i++)
		{
			if (util.trim(aFormat[i]) != '')
			{
				aFormatArgs[aFormatArgs.length] = aFormat[i];
			}
		}

		// a month name is converted only when it is not the first part - the check is `m > 0`
		let m = util.array_search('MMMM', aFormatArgs);
		if (m > 0)
		{
			aDateArgs[m] = getNumMonth(aDateArgs[m]);
			aFormatArgs[m] = 'MM';
		}
		else
		{
			m = util.array_search('M', aFormatArgs);
			if (m > 0)
			{
				aDateArgs[m] = getNumMonth(aDateArgs[m]);
				aFormatArgs[m] = 'MM';
			}
		}

		for (i = 0, cnt = aFormatArgs.length; i < cnt; i++)
		{
			const k = aFormatArgs[i].toUpperCase();
			aResult[k] = k == 'T' || k == 'TT' ? aDateArgs[i] : parseInt(aDateArgs[i], 10);
		}

		if (aResult.DD > 0 && aResult.MM > 0 && aResult.YYYY > 0)
		{
			const d = new Date();

			if (bUTC)
			{
				// setUTCDate(1) first, so that setUTCMonth cannot overflow on a long date
				d.setUTCDate(1);
				d.setUTCFullYear(aResult.YYYY);
				d.setUTCMonth(aResult.MM - 1);
				d.setUTCDate(aResult.DD);
				d.setUTCHours(0, 0, 0, 0);
			}
			else
			{
				d.setDate(1);
				d.setFullYear(aResult.YYYY);
				d.setMonth(aResult.MM - 1);
				d.setDate(aResult.DD);
				d.setHours(0, 0, 0, 0);
			}

			if (
				(!isNaN(aResult.HH) || !isNaN(aResult.GG) || !isNaN(aResult.H) || !isNaN(aResult.G))
				&& !isNaN(aResult.MI)
			)
			{
				if (!isNaN(aResult.H) || !isNaN(aResult.G))
				{
					const bPM = (aResult.T || aResult.TT || 'am').toUpperCase() == 'PM';
					const h = parseInt(aResult.H || aResult.G || 0, 10);
					if (bPM)
					{
						aResult.HH = h + (h == 12 ? 0 : 12);
					}
					else
					{
						aResult.HH = h < 12 ? h : 0;
					}
				}
				else
				{
					aResult.HH = parseInt(aResult.HH || aResult.GG || 0, 10);
				}

				if (isNaN(aResult.SS))
				{
					aResult.SS = 0;
				}

				if (bUTC)
				{
					d.setUTCHours(aResult.HH, aResult.MI, aResult.SS);
				}
				else
				{
					d.setHours(aResult.HH, aResult.MI, aResult.SS);
				}
			}

			return d;
		}
	}

	return null;
}
