import getTag from '../internal/get-tag';

const objectCtorString = Function.prototype.toString.call(Object);

/**
 * @memberOf BX
 */
export default class Type
{
	/**
	 * Checks that value is string
	 * @param value
	 * @return {boolean}
	 */
	static isString(value: unknown): value is string
	{
		return typeof value === 'string';
	}

	/**
	 * Returns true if a value is not empty string
	 * @param value
	 * @returns {boolean}
	 */
	static isStringFilled(value: unknown): value is string
	{
		return Type.isString(value) && value !== '';
	}

	/**
	 * Checks that value is function
	 * @param value
	 * @return {boolean}
	 */
	static isFunction(value: unknown): value is Function
	{
		return typeof value === 'function';
	}

	/**
	 * Checks that value is object
	 * @param value
	 * @return {boolean}
	 */
	static isObject(value: unknown): value is object
	{
		return Boolean(value) && (typeof value === 'object' || typeof value === 'function');
	}

	/**
	 * Checks that value is object like
	 * @param value
	 * @return {boolean}
	 */
	static isObjectLike(value: unknown): value is Record<string, unknown>
	{
		return Boolean(value) && typeof value === 'object';
	}

	/**
	 * Checks that value is plain object
	 * @param value
	 * @return {boolean}
	 */
	static isPlainObject(value: unknown): value is Record<string, unknown>
	{
		if (!Type.isObjectLike(value) || getTag(value) !== '[object Object]')
		{
			return false;
		}

		const proto = Object.getPrototypeOf(value);
		if (proto === null)
		{
			return true;
		}

		const ctor = proto.hasOwnProperty('constructor') && proto.constructor;

		return typeof ctor === 'function' && Function.prototype.toString.call(ctor) === objectCtorString;
	}

	/**
	 * Checks that value is boolean
	 * @param value
	 * @return {boolean}
	 */
	static isBoolean(value: unknown): value is boolean
	{
		return value === true || value === false;
	}

	/**
	 * Checks that value is number
	 * @param value
	 * @return {boolean}
	 */
	static isNumber(value: unknown): value is number
	{
		return !Number.isNaN(value) && typeof value === 'number';
	}

	/**
	 * Checks that value is integer
	 * @param value
	 * @return {boolean}
	 */
	static isInteger(value: unknown): value is number
	{
		return Type.isNumber(value) && value % 1 === 0;
	}

	/**
	 * Checks that value is float
	 * @param value
	 * @return {boolean}
	 */
	static isFloat(value: unknown): value is number
	{
		return Type.isNumber(value) && !Type.isInteger(value);
	}

	/**
	 * Checks that value is nil
	 * @param value
	 * @return {boolean}
	 */
	static isNil(value: unknown): value is null | undefined
	{
		return value === null || value === undefined;
	}

	/**
	 * Checks that value is array
	 * @param value
	 * @return {boolean}
	 */
	static isArray<T = unknown>(value: unknown): value is T[]
	{
		return !Type.isNil(value) && Array.isArray(value);
	}

	/**
	 * Returns true if a value is an array, and it has at least one element
	 * @param value
	 * @returns {boolean}
	 */
	static isArrayFilled<T = unknown>(value: unknown): value is [T, ...T[]]
	{
		return Type.isArray(value) && value.length > 0;
	}

	/**
	 * Checks that value is array like
	 * @param value
	 * @return {boolean}
	 */
	static isArrayLike(value: unknown): value is ArrayLike<unknown>
	{
		if (Type.isNil(value) || Type.isFunction(value) || !('length' in (value as object)))
		{
			return false;
		}

		const { length } = value as { length: unknown };

		return Type.isNumber(length) && length > -1 && length <= Number.MAX_SAFE_INTEGER;
	}

	/**
	 * Checks that value is Date
	 * @param value
	 * @return {boolean}
	 */
	static isDate(value: unknown): value is Date
	{
		return Type.isObjectLike(value) && getTag(value) === '[object Date]';
	}

	/**
	 * Checks that is DOM node
	 * @param value
	 * @return {boolean}
	 */
	static isDomNode(value: unknown): value is Node
	{
		return Type.isObjectLike(value) && !Type.isPlainObject(value) && 'nodeType' in value;
	}

	/**
	 * Checks that value is element node
	 * @param value
	 * @return {boolean}
	 */
	static isElementNode(value: unknown): value is HTMLElement
	{
		return Type.isDomNode(value) && value.nodeType === Node.ELEMENT_NODE;
	}

	/**
	 * Checks that value is EventTarget like object
	 * @param value
	 * @return {boolean}
	 */
	static isEventTargetLike(value: unknown): value is EventTarget
	{
		return (
			Type.isObjectLike(value)
			&& Type.isFunction(value.addEventListener)
			&& Type.isFunction(value.removeEventListener)
			&& Type.isFunction(value.dispatchEvent)
		);
	}

	/**
	 * Checks that value is text node
	 * @param value
	 * @return {boolean}
	 */
	static isTextNode(value: unknown): value is Text
	{
		return Type.isDomNode(value) && value.nodeType === Node.TEXT_NODE;
	}

	/**
	 * Checks that value is Map
	 * @param value
	 * @return {boolean}
	 */
	static isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V>
	{
		return Type.isObjectLike(value) && getTag(value) === '[object Map]';
	}

	/**
	 * Checks that value is Set
	 * @param value
	 * @return {boolean}
	 */
	static isSet<T = unknown>(value: unknown): value is Set<T>
	{
		return Type.isObjectLike(value) && getTag(value) === '[object Set]';
	}

	/**
	 * Checks that value is WeakMap
	 * @param value
	 * @return {boolean}
	 */
	static isWeakMap<K extends WeakKey = WeakKey, V = unknown>(value: unknown): value is WeakMap<K, V>
	{
		return Type.isObjectLike(value) && getTag(value) === '[object WeakMap]';
	}

	/**
	 * Checks that value is WeakSet
	 * @param value
	 * @return {boolean}
	 */
	static isWeakSet<T extends WeakKey = WeakKey>(value: unknown): value is WeakSet<T>
	{
		return Type.isObjectLike(value) && getTag(value) === '[object WeakSet]';
	}

	/**
	 * Checks that value is prototype
	 * @param value
	 * @return {boolean}
	 */
	static isPrototype(value: unknown): boolean
	{
		if (!Type.isObjectLike(value))
		{
			return false;
		}

		const ctor = value.constructor;
		const proto = Type.isFunction(ctor) ? ctor.prototype : Object.prototype;

		return proto === value;
	}

	/**
	 * Checks that value is regexp
	 * @param value
	 * @return {boolean}
	 */
	static isRegExp(value: unknown): value is RegExp
	{
		return Type.isObjectLike(value) && getTag(value) === '[object RegExp]';
	}

	/**
	 * Checks that value is null
	 * @param value
	 * @return {boolean}
	 */
	static isNull(value: unknown): value is null
	{
		return value === null;
	}

	/**
	 * Checks that value is undefined
	 * @param value
	 * @return {boolean}
	 */
	static isUndefined(value: unknown): value is undefined
	{
		return typeof value === 'undefined';
	}

	/**
	 * Checks that value is ArrayBuffer
	 * @param value
	 * @return {boolean}
	 */
	static isArrayBuffer(value: unknown): value is ArrayBuffer
	{
		return Type.isObjectLike(value) && getTag(value) === '[object ArrayBuffer]';
	}

	/**
	 * Checks that value is typed array
	 * @param value
	 * @return {boolean}
	 */
	static isTypedArray(value: unknown): boolean
	{
		const regExpTypedTag = /^\[object (?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)]$/;

		return Type.isObjectLike(value) && regExpTypedTag.test(getTag(value));
	}

	/**
	 * Checks that value is Blob
	 * @param value
	 * @return {boolean}
	 */
	static isBlob(value: unknown): value is Blob
	{
		return (
			Type.isObjectLike(value)
			&& Type.isNumber(value.size)
			&& Type.isString(value.type)
			&& Type.isFunction(value.slice)
		);
	}

	/**
	 * Checks that value is File
	 * @param value
	 * @return {boolean}
	 */
	static isFile(value: unknown): value is File
	{
		if (!Type.isBlob(value) || !('name' in value) || !Type.isString(value.name))
		{
			return false;
		}

		if ('lastModified' in value && Type.isNumber(value.lastModified))
		{
			return true;
		}

		return 'lastModifiedDate' in value && Type.isObjectLike(value.lastModifiedDate);
	}

	/**
	 * Checks that value is FormData
	 * @param value
	 * @return {boolean}
	 */
	static isFormData(value: unknown): value is FormData
	{
		return value instanceof FormData;
	}

	static isJsonValue(value: unknown): boolean
	{
		return (
			Type.isPlainObject(value)
			|| Type.isString(value)
			|| Type.isNumber(value)
			|| Type.isBoolean(value)
			|| Type.isNull(value)
			|| Type.isArray(value)
		);
	}
}
