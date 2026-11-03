/**
 * @module utils/type
 */
jn.define('utils/type', (require, exports, module) => {
	/**
	 * @param {any} value
	 * @returns {Boolean}
	 */
	function isNil(value)
	{
		return typeof value === 'undefined' || value === null;
	}

	/**
	 * @param {Function|Class} fn
	 * @return {boolean}
	 */
	function isESClass(fn)
	{
		return typeof fn === 'function' && Object.getOwnPropertyDescriptor(fn, 'prototype')?.writable === false;
	}

	/**
	 * @param {any} value
	 * @return {Boolean}
	 */
	function isRegExp(value)
	{
		return value instanceof RegExp;
	}

	/**
	 * @param {any} value
	 * @return {boolean}
	 */
	function isValidDateObject(value)
	{
		return value instanceof Date && !isNaN(value);
	}

	/**
	 * @param {any} value
	 * @return {boolean}
	 */
	function isNotEmptyString(value)
	{
		return (typeof value === 'string') && value !== '';
	}

	/**
	 * @param {any} value
	 * @return {boolean}
	 */
	function isBoolean(value)
	{
		return value === true || value === false;
	}

	/**
	 * A scalar carries a value: neither nil nor an empty string. Zero and `false` are values.
	 *
	 * @param {any} value
	 * @return {boolean}
	 */
	function isFilledScalar(value)
	{
		if (isNil(value))
		{
			return false;
		}

		return typeof value !== 'string' || value !== '';
	}

	/**
	 * A boolean flag as the backend spells it: `Y`, `1` and `true` all mean yes.
	 *
	 * @param {any} value
	 * @return {boolean}
	 */
	function isTruthyFlag(value)
	{
		return value === true || value === 1 || value === '1' || value === 'Y';
	}

	module.exports = {
		isNil,
		isRegExp,
		isESClass,
		isBoolean,
		isValidDateObject,
		isNotEmptyString,
		isFilledScalar,
		isTruthyFlag,
	};
});
