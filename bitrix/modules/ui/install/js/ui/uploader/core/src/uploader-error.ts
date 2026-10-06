import { BaseError, Type, Loc } from 'main.core';

type UploaderErrorOrigin = (typeof UploaderError.Origin)[keyof typeof UploaderError.Origin];
type UploaderErrorType = (typeof UploaderError.Type)[keyof typeof UploaderError.Type];

type AjaxError = {
	type?: string,
	system?: boolean,
	code?: string | number,
	message?: string,
	description?: string,
	customData?: { [key: string]: any } | null,
};

/**
 * @namespace BX.UI.Uploader
 */
export class UploaderError extends BaseError
{
	static Origin = {
		SERVER: 'server',
		CLIENT: 'client',
	};

	static Type = {
		USER: 'user',
		SYSTEM: 'system',
		UNKNOWN: 'unknown',
	};

	description: string = '';
	origin: UploaderErrorOrigin = UploaderError.Origin.CLIENT;
	type: UploaderErrorType = UploaderError.Type.USER;

	/**
	 * new UploaderError(code)
	 * new UploaderError(code, customData)
	 * new UploaderError(code, message)
	 * new UploaderError(code, message, description)
	 * new UploaderError(code, message, customData)
	 * new UploaderError(code, message, description, customData)
	 */
	constructor(code: string, ...args: Array<any>)
	{
		let message: string | null | undefined = Type.isString(args[0]) ? args[0] : null;
		let description: string | null | undefined = Type.isString(args[1]) ? args[1] : null;
		const customData = Type.isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {};

		const replacements: { [key: string]: any } = {};
		Object.keys(customData).forEach((key: string): void => {
			replacements[`#${key}#`] = customData[key];
		});

		if (!Type.isString(message) && Loc.hasMessage(`UPLOADER_${code}`))
		{
			message = Loc.getMessage(`UPLOADER_${code}`, replacements);
		}

		if (Type.isStringFilled(message) && !Type.isString(description) && Loc.hasMessage(`UPLOADER_${code}_DESC`))
		{
			description = Loc.getMessage(`UPLOADER_${code}_DESC`, replacements);
		}

		super(message ?? undefined, code, customData);
		this.setDescription(description);
	}

	static createFromAjaxErrors(errors: Array<AjaxError>): UploaderError
	{
		if (!Type.isArrayFilled(errors) || !Type.isPlainObject(errors[0]))
		{
			return new this('SERVER_ERROR');
		}

		const uploaderError = errors.find((error: AjaxError) => {
			return error.type === 'file-uploader';
		});

		if (uploaderError && !uploaderError.system)
		{
			// Take the First Uploader User Error
			const { code, message, description, customData } = uploaderError;
			const error: UploaderError = new this(code as string, message, description, customData);
			error.setOrigin(UploaderError.Origin.SERVER);
			error.setType(UploaderError.Type.USER);

			return error;
		}

		let { code, message, description } = errors[0];
		const { customData, system, type } = errors[0];

		if (code === 'NETWORK_ERROR')
		{
			message = Loc.getMessage('UPLOADER_NETWORK_ERROR');
		}
		else
		{
			code = Type.isStringFilled(code) ? code : 'SERVER_ERROR';
			if (!Type.isStringFilled(description))
			{
				description = message;
				message = Loc.getMessage('UPLOADER_SERVER_ERROR');
			}
		}

		console.error('Uploader', errors);

		const error: UploaderError = new this(code as string, message, description, customData);
		error.setOrigin(UploaderError.Origin.SERVER);

		if (type === 'file-uploader')
		{
			error.setType(system ? UploaderError.Type.SYSTEM : UploaderError.Type.USER);
		}
		else
		{
			error.setType(UploaderError.Type.UNKNOWN);
		}

		return error;
	}

	static createFromError(error: Error): UploaderError
	{
		return new this(error.name, error.message);
	}

	getDescription(): string
	{
		return this.description;
	}

	setDescription(text: string | null | undefined): this
	{
		if (Type.isString(text))
		{
			this.description = text;
		}

		return this;
	}

	getOrigin(): UploaderErrorOrigin
	{
		return this.origin;
	}

	setOrigin(origin: UploaderErrorOrigin): this
	{
		if (Object.values(UploaderError.Origin).includes(origin))
		{
			this.origin = origin;
		}

		return this;
	}

	getType(): UploaderErrorType
	{
		return this.type;
	}

	setType(type: UploaderErrorType): this
	{
		if (Type.isStringFilled(type))
		{
			this.type = type;
		}

		return this;
	}

	clone(): UploaderError
	{
		const options = JSON.parse(JSON.stringify(this));
		const error = new UploaderError(options.code, options.message, options.description, options.customData);

		error.setOrigin(options.origin);
		error.setType(options.type);

		return error;
	}

	toString(): string
	{
		return `Uploader Error (${this.getCode()}): ${this.getMessage()} (${this.getOrigin()})`;
	}

	toJSON(): { [key: string]: any }
	{
		return {
			code: this.getCode(),
			message: this.getMessage(),
			description: this.getDescription(),
			origin: this.getOrigin(),
			type: this.getType(),
			customData: this.getCustomData(),
		};
	}
}
