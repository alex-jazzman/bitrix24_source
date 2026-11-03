/**
 * @module mail/ai-subject/src/notice-kind
 */
jn.define('mail/ai-subject/src/notice-kind', (require, exports, module) => {
	/**
	 * Kinds of notice raised while generating a subject. The controller owns
	 * what happened, the host form owns how it looks.
	 */
	const NoticeKind = Object.freeze({
		ERROR: 'error',
		LIMIT: 'limit',
		HINT: 'hint',
	});

	const LIMIT_ERROR_CODE = 'LIMIT_IS_EXCEEDED';

	/**
	 * @param {Array} errors Error list of a failed generateSubject response.
	 * @return {boolean} Whether the failure means the AI request limit is exhausted.
	 */
	function isLimitError(errors)
	{
		if (!Array.isArray(errors))
		{
			return false;
		}

		return errors.some((error) => {
			const code = error?.code;

			return (
				code === LIMIT_ERROR_CODE
				|| (
					typeof code === 'string'
					&& code.startsWith(`${LIMIT_ERROR_CODE}_`)
				)
			);
		});
	}

	/**
	 * @param {string} body Cleaned compose body (without signature).
	 * @return {boolean} Whether there is nothing to generate a subject from.
	 */
	function isBodyEmpty(body)
	{
		return typeof body !== 'string' || body.trim() === '';
	}

	module.exports = { NoticeKind, isLimitError, isBodyEmpty };
});
