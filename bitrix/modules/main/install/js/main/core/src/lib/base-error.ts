import Type from './type';

const isError = Symbol.for('BX.BaseError.isError');

/**
 * @memberOf BX
 */
export default class BaseError
{
	[isError]: boolean;
	message: string;
	code: string | null;
	customData: unknown;

	constructor(message?: string, code?: string, customData?: unknown)
	{
		this[isError] = true;
		this.message = '';
		this.code = null;
		this.customData = null;

		this.setMessage(message);
		this.setCode(code);
		this.setCustomData(customData);
	}

	/**
	 * Returns a brief description of the error
	 * @returns {string}
	 */
	getMessage(): string
	{
		return this.message;
	}

	/**
	 * Sets a message of the error
	 * @param {string} message
	 * @returns {this}
	 */
	setMessage(message?: string): this
	{
		if (Type.isString(message))
		{
			this.message = message;
		}

		return this;
	}

	/**
	 * Returns a code of the error
	 * @returns {?string}
	 */
	getCode(): string | null
	{
		return this.code;
	}

	/**
	 * Sets a code of the error
	 * @param {string} code
	 * @returns {this}
	 */
	setCode(code?: string | null): this
	{
		if (Type.isStringFilled(code) || code === null)
		{
			this.code = code;
		}

		return this;
	}

	/**
	 * Returns custom data of the error
	 * @returns {null|*}
	 */
	getCustomData(): unknown
	{
		return this.customData;
	}

	/**
	 * Sets custom data of the error
	 * @returns {this}
	 */
	setCustomData(customData: unknown): this
	{
		if (!Type.isUndefined(customData))
		{
			this.customData = customData;
		}

		return this;
	}

	toString(): string
	{
		const code = this.getCode();
		const message = this.getMessage();

		if (!Type.isStringFilled(code) && !Type.isStringFilled(message))
		{
			return '';
		}

		if (!Type.isStringFilled(code))
		{
			return `Error: ${message}`;
		}

		if (!Type.isStringFilled(message))
		{
			return code;
		}

		return `${code}: ${message}`;
	}

	/**
	 * Returns true if the object is an instance of BaseError
	 * @param error
	 * @returns {boolean}
	 */
	static isError(error: unknown): error is BaseError
	{
		return Type.isObject(error) && (error as any)[isError] === true;
	}
}
