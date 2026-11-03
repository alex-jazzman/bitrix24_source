/**
 * @module vibecode/catalog/share/src/share-api
 */
jn.define('vibecode/catalog/share/src/share-api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Type } = require('type');

	const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';

	const ShareAction = Object.freeze({
		GetShare: 'vibecodeconnector.Catalog.getShare',
		SetShare: 'vibecodeconnector.Catalog.setShare',
		GetLink: 'vibecodeconnector.Catalog.getLink',
		SetLink: 'vibecodeconnector.Catalog.setLink',
	});

	/**
	 * The single normalizer of everything the sharing flow fails with: an answer carrying errors,
	 * a transport rejection and the Errors the state machine throws. Its code picks both the
	 * branch of behaviour and the message shown to the user, so there is exactly one of it.
	 *
	 * @param {unknown} error
	 * @return {string}
	 */
	const normalizeShareErrorCode = (error) => {
		if (error instanceof Error)
		{
			return Type.isStringFilled(error.message) ? error.message : UNKNOWN_ERROR_CODE;
		}

		const [firstError] = Array.isArray(error?.errors) ? error.errors : [];

		return Type.isStringFilled(firstError?.code) ? firstError.code : UNKNOWN_ERROR_CODE;
	};

	/**
	 * The four sharing actions of the catalog controller and nothing else: this class knows how to
	 * call them, not when. It shows the user nothing - neither toasts nor alerts.
	 */
	class VibeCodeCatalogShareApi
	{
		/**
		 * @param {number} catalogItemId
		 * @return {Promise<SharePayload>}
		 */
		getShare(catalogItemId)
		{
			return this.#run(ShareAction.GetShare, { catalogItemId })
				.then((responseData) => responseData.share);
		}

		/**
		 * @param {number} catalogItemId
		 * @param {SharePayload} share
		 * @return {Promise<SharePayload>}
		 */
		setShare(catalogItemId, share)
		{
			const data = {
				catalogItemId,
				audience: share.audience,
			};

			if (share.users.length > 0)
			{
				data.users = share.users;
			}

			if (share.departments.length > 0)
			{
				data.departments = share.departments;
			}

			return this.#run(ShareAction.SetShare, data)
				.then((responseData) => responseData.share);
		}

		/**
		 * @param {number} catalogItemId
		 * @return {Promise<LinkState>}
		 */
		getLink(catalogItemId)
		{
			return this.#run(ShareAction.GetLink, { catalogItemId })
				.then((responseData) => responseData.linkState);
		}

		/**
		 * @param {number} catalogItemId
		 * @param {SetLinkPayload} payload
		 * @return {Promise<LinkState>}
		 */
		setLink(catalogItemId, payload)
		{
			// The body is form-encoded, so a boolean would reach the server as the string "false"
			// and cast back to true there: flags travel as 1 and 0. A null expiry is dropped by the
			// transport together with its field, and that absence is what a permanent link means.
			const data = {
				catalogItemId,
				enabled: payload.enabled ? 1 : 0,
			};

			if (payload.enabled)
			{
				data.expiresAt = payload.expiresAt;
				data.requireB24Auth = payload.requireB24Auth ? 1 : 0;
			}

			return this.#run(ShareAction.SetLink, data)
				.then((responseData) => responseData.linkState);
		}

		/**
		 * @param {string} action
		 * @param {Record<string, unknown>} data
		 * @return {Promise<Record<string, unknown>>}
		 */
		#run(action, data)
		{
			return (new RunActionExecutor(action, data))
				.call(false)
				.then((response) => {
					const errors = Array.isArray(response?.errors) ? response.errors : [];
					if (errors.length > 0)
					{
						return Promise.reject(response);
					}

					return response?.data ?? {};
				})
				.catch((error) => Promise.reject(new Error(normalizeShareErrorCode(error))))
			;
		}
	}

	module.exports = {
		VibeCodeCatalogShareApi,
		normalizeShareErrorCode,
	};
});
