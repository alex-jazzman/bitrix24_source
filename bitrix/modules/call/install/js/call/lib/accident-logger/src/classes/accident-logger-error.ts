export class AccidentLoggerError extends Error
{
	originalError: Error | null;

	constructor(message: string)
	{
		super(message);
		this.name = 'CallAccidentLoggerError';
		this.originalError = null;
	}

	static getByError(error: unknown): AccidentLoggerError
	{
		if (error instanceof AccidentLoggerError)
		{
			return error;
		}

		if (error instanceof Error)
		{
			const newError = new AccidentLoggerError(error.message);
			newError.stack = error.stack;
			if (error.name)
			{
				newError.name = `${newError.name}: ${error.name}`;
			}
			newError.originalError = error;

			return newError;
		}

		return new AccidentLoggerError(String(error));
	}
}
