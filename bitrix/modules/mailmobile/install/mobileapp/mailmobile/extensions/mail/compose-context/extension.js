/**
 * @module mail/compose-context
 */
jn.define('mail/compose-context', (require, exports, module) => {
	function resolveRestoredDraft(explicitValue, body, bodyMeansDraftByDefault = false)
	{
		if (explicitValue !== undefined && explicitValue !== null)
		{
			return Boolean(explicitValue);
		}

		return bodyMeansDraftByDefault && typeof body === 'string' && body.length > 0;
	}

	module.exports = { resolveRestoredDraft };
});
