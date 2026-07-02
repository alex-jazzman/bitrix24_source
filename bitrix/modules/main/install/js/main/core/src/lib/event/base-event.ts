import Type from '../type';
import BaseError from '../base-error';
/**
 * Implements base event object interface
 */
export default class BaseEvent<DataType = any>
{
	type: string = '';
	data: DataType | null = null;
	target: any = null;
	compatData: Array<any> | null = null;
	defaultPrevented: boolean = false;
	immediatePropagationStopped: boolean = false;
	errors: Array<BaseError> = [];

	constructor(
		options: {
			data?: any,
			compatData?: Array<any>
		} = {
			data: {},
		},
	)
	{
		this.setData(options.data);
		this.setCompatData(options.compatData);
	}

	static create(options: any): BaseEvent
	{
		return new this(options);
	}

	/**
	 * Returns the name of the event
	 * @returns {string}
	 */
	getType(): string
	{
		return this.type;
	}

	/**
	 *
	 * @param {string} type
	 */
	setType(type: string): this
	{
		if (Type.isStringFilled(type))
		{
			this.type = type;
		}

		return this;
	}

	/**
	 * Returns an event data
	 */
	getData(): DataType | null
	{
		return this.data;
	}

	/**
	 * Sets an event data
	 * @param data
	 */
	setData(data: any): this
	{
		if (!Type.isUndefined(data))
		{
			this.data = data;
		}

		return this;
	}

	/**
	 * Returns arguments for BX.addCustomEvent handlers (deprecated).
	 * @returns {array | null}
	 */
	getCompatData(): Array<any> | null
	{
		return this.compatData;
	}

	/**
	 * Sets arguments for BX.addCustomEvent handlers (deprecated)
	 * @param data
	 */
	setCompatData(data: any): this
	{
		if (Type.isArrayLike(data))
		{
			this.compatData = data as Array<any>;
		}

		return this;
	}

	/**
	 * Sets a event target
	 * @param target
	 */
	setTarget(target: any): this
	{
		this.target = target;

		return this;
	}

	/**
	 * Returns a event target
	 */
	getTarget(): any
	{
		return this.target;
	}

	/**
	 * Returns an array of event errors
	 * @returns {[]}
	 */
	getErrors(): Array<BaseError>
	{
		return this.errors;
	}

	/**
	 * Adds an error of the event.
	 * Event listeners can prevent emitter's default action and set the reason of this behavior.
	 * @param error
	 */
	setError(error: BaseError): void
	{
		if (BaseError.isError(error))
		{
			this.errors.push(error);
		}
	}

	/**
	 * Prevents default action
	 */
	preventDefault(): void
	{
		this.defaultPrevented = true;
	}

	/**
	 * Checks that is default action prevented
	 * @return {boolean}
	 */
	isDefaultPrevented(): boolean
	{
		return this.defaultPrevented;
	}

	/**
	 * Stops event immediate propagation
	 */
	stopImmediatePropagation(): void
	{
		this.immediatePropagationStopped = true;
	}

	/**
	 * Checks that is immediate propagation stopped
	 * @return {boolean}
	 */
	isImmediatePropagationStopped(): boolean
	{
		return this.immediatePropagationStopped;
	}
}
