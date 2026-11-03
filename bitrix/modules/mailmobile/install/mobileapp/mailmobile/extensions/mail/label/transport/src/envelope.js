/**
 * @module mail/label/transport/src/envelope
 */
jn.define('mail/label/transport/src/envelope', (require, exports, module) => {
	const DEFAULT_ERROR = 'Label action of the mail module denied';

	/**
	 * @param {ActionResponse} response
	 * @return {string}
	 */
	const errorMessage = (response) => {
		const [firstError] = response?.errors ?? [];

		return firstError?.message || DEFAULT_ERROR;
	};

	/**
	 * The payload of an action response.
	 *
	 * The handler of `RunActionExecutor` is called with the whole envelope — `{ status, data, errors }`
	 * — and it is called for a denial too. Reading a field straight off the envelope therefore loses
	 * the payload and turns a denial into a silent empty answer.
	 *
	 * @param {ActionResponse} response
	 * @return {object} payload of a successful action
	 * @throws {Error} when the action denied
	 */
	const readActionData = (response) => {
		if (!response || response.status === 'error')
		{
			throw new Error(errorMessage(response));
		}

		return response.data ?? {};
	};

	module.exports = { readActionData };
});
