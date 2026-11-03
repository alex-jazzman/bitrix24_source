import { BX } from './internal/global';

/**
 * `BX.prop` - ten accessors used by 454 files (MOD-01).
 *
 * The family looks uniform and is not: only half of the methods consult `hasOwnProperty`,
 * `getInteger` does not truncate a value that is already a number, `getBoolean` accepts only the
 * string "true", `getString` drops the default value once the property exists, and `extractDate`
 * works in place. Every one of these is transcribed as it stands and pinned by
 * `test/old/core/prop.test.ts` - see FIX-01, "transcribed verbatim".
 */
export const prop = {
	get(object: any, key: any, defaultValue?: any): any
	{
		return object && Object.prototype.hasOwnProperty.call(object, key) ? object[key] : defaultValue;
	},
	getObject(object: any, key: any, defaultValue?: any): any
	{
		return object && BX.type.isPlainObject(object[key]) ? object[key] : defaultValue;
	},
	getElementNode(object: any, key: any, defaultValue?: any): any
	{
		return object && BX.type.isElementNode(object[key]) ? object[key] : defaultValue;
	},
	getArray(object: any, key: any, defaultValue?: any): any
	{
		return object && BX.type.isArray(object[key]) ? object[key] : defaultValue;
	},
	getFunction(object: any, key: any, defaultValue?: any): any
	{
		return object && BX.type.isFunction(object[key]) ? object[key] : defaultValue;
	},
	getNumber(object: any, key: any, defaultValue?: any): any
	{
		if (!(object && Object.prototype.hasOwnProperty.call(object, key)))
		{
			return defaultValue;
		}

		let value = object[key];
		if (BX.type.isNumber(value))
		{
			return value;
		}

		value = parseFloat(value);

		return isNaN(value) ? defaultValue : value;
	},
	getInteger(object: any, key: any, defaultValue?: any): any
	{
		if (!(object && Object.prototype.hasOwnProperty.call(object, key)))
		{
			return defaultValue;
		}

		let value = object[key];
		// a number is returned as is, fractional part included - the name promises more than the code does
		if (BX.type.isNumber(value))
		{
			return value;
		}

		value = parseInt(value);

		return isNaN(value) ? defaultValue : value;
	},
	getBoolean(object: any, key: any, defaultValue?: any): any
	{
		if (!(object && Object.prototype.hasOwnProperty.call(object, key)))
		{
			return defaultValue;
		}

		const value = object[key];

		// among strings only "true" is true: "1", "yes" and "Y" all answer false
		return (BX.type.isBoolean(value)
			? value
			: (BX.type.isString(value) ? (value.toLowerCase() === 'true') : Boolean(value))
		);
	},
	getString(object: any, key: any, defaultValue?: any): any
	{
		if (!(object && Object.prototype.hasOwnProperty.call(object, key)))
		{
			return defaultValue;
		}

		const value = object[key];

		// once the property exists the default value is out of play: a falsy non-string gives ''
		return BX.type.isString(value) ? value : (value ? value.toString() : '');
	},
	extractDate(datetime?: any): Date
	{
		if (!BX.type.isDate(datetime))
		{
			datetime = new Date();
		}

		// mutates the caller's date and hands the same object back
		datetime.setHours(0);
		datetime.setMinutes(0);
		datetime.setSeconds(0);
		datetime.setMilliseconds(0);

		return datetime;
	},
};
