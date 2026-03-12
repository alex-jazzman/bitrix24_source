export class AccidentLoggerError extends Error
{
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = 'CallAccidentLoggerError';
		this.originalError = null;
	}

	/**
	 * @param {Error} error
	 */
	static getByError(error) {
		if (error instanceof AccidentLoggerError)
		{
			return error;
		}

		const newError = new AccidentLoggerError(error.message);
		newError.stack = error.stack;
		if (error.name)
		{
			newError.name = `${newError.name}: ${error.name}`;
		}
		newError.originalError = error;

		return newError;
	}
}
