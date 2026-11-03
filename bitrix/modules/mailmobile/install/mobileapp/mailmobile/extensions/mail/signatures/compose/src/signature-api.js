/**
 * @module mail/signatures/compose/src/signature-api
 */
jn.define('mail/signatures/compose/src/signature-api', (require, exports, module) => {
	const Action = Object.freeze({
		GET_CONTEXT: 'mail.api.signature.getAvailableForSenders',
		ADD_OWNER: 'mail.api.signature.addOwner',
		DELETE_OWNER: 'mail.api.signature.deleteOwner',
		SET_CHOICE: 'mail.api.signature.setChoice',
	});
	const UNAVAILABLE_ERROR_CODES = new Set([
		'22002',
		'ERROR_ACTION_NOT_FOUND',
		'ERROR_CONTROLLER_NOT_FOUND',
		'ERROR_METHOD_NOT_FOUND',
		'MAIN_CONTROLLER_22002',
		'SIGNATURE_FEATURE_DISABLED',
	]);

	class SignatureApi
	{
		loadContext()
		{
			return this.#run(Action.GET_CONTEXT, {});
		}

		/**
		 * @param {SignatureCreateParams} params
		 * @return {Promise<MobileSignature>}
		 */
		addOwner({ text, senderKey = null, senderKeys = [] })
		{
			const data = { text };
			if (Array.isArray(senderKeys) && senderKeys.length > 0)
			{
				data.senderKeys = senderKeys;
			}
			else if (senderKey)
			{
				data.senderKey = senderKey;
			}

			return this.#run(Action.ADD_OWNER, data)
				.then(({ item }) => item)
			;
		}

		/**
		 * @param {number} id
		 * @return {Promise<{ok: boolean}>}
		 */
		deleteOwner(id)
		{
			return this.#run(Action.DELETE_OWNER, { id });
		}

		setChoice(senderKey, signatureId)
		{
			return this.#run(Action.SET_CHOICE, { senderKey, signatureId });
		}

		/**
		 * @param {unknown} failure
		 * @return {boolean}
		 */
		static isUnavailableFailure(failure)
		{
			if (Number(failure?.status) === 404)
			{
				return true;
			}

			const errors = [
				...(Array.isArray(failure?.errors) ? failure.errors : []),
				...(Array.isArray(failure?.data?.errors) ? failure.data.errors : []),
			];
			if (failure?.code !== undefined)
			{
				errors.push(failure);
			}

			return errors.some((error) => UNAVAILABLE_ERROR_CODES.has(String(error?.code)));
		}

		#run(action, data)
		{
			return BX.ajax.runAction(action, { data }).then(({ data: responseData }) => responseData);
		}
	}

	module.exports = { SignatureApi };
});
