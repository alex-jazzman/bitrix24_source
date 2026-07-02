import { Type } from 'main.core';
import { isDatesEqual } from './is-dates-equal';
import { type DateMatcher } from '../date-picker-options';

export function isDateMatch(day: Date, matchers: DateMatcher[]): boolean
{
	return matchers.some((matcher: DateMatcher) => {
		if (Type.isFunction(matcher))
		{
			return matcher(day);
		}

		if (Type.isDate(matcher))
		{
			return isDatesEqual(day, matcher);
		}

		if (Type.isArray(matcher))
		{
			return matcher.some((date: Date) => {
				return isDatesEqual(day, date);
			});
		}

		if (Type.isBoolean(matcher))
		{
			return matcher;
		}

		if (Type.isPlainObject(matcher))
		{
			return isExtraMatch(day, matcher);
		}

		return false;
	});
}

function isExtraMatch(day: Date, matcher: Object): boolean
{
	if (Type.isArray(matcher.dayOfWeek))
	{
		return matcher.dayOfWeek.includes(day.getUTCDay());
	}

	if (Type.isArray(matcher.dayOfMonth))
	{
		return matcher.dayOfMonth.includes(day.getUTCDate());
	}

	const t = day.getTime();

	if (Type.isDate(matcher.from) || Type.isDate(matcher.to))
	{
		const fromOk = !Type.isDate(matcher.from) || t >= matcher.from.getTime();
		const toOk = !Type.isDate(matcher.to) || t <= matcher.to.getTime();

		return fromOk && toOk;
	}

	if (Type.isDate(matcher.before) && Type.isDate(matcher.after))
	{
		return t > matcher.after.getTime() && t < matcher.before.getTime();
	}

	if (Type.isDate(matcher.before))
	{
		return t < matcher.before.getTime();
	}

	if (Type.isDate(matcher.after))
	{
		return t > matcher.after.getTime();
	}

	return false;
}
