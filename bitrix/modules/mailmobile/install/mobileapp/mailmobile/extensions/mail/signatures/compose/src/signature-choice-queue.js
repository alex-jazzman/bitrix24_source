/**
 * @module mail/signatures/compose/src/signature-choice-queue
 */
jn.define('mail/signatures/compose/src/signature-choice-queue', (require, exports, module) => {
	class SignatureChoiceQueue
	{
		constructor(saveChoice)
		{
			this.saveChoice = saveChoice;
			this.requests = new Map();
		}

		enqueue(senderKey, signatureId)
		{
			const previousRequest = this.requests.get(senderKey) ?? Promise.resolve();
			const request = previousRequest
				.catch(() => {})
				.then(() => this.saveChoice(senderKey, signatureId))
			;
			this.requests.set(senderKey, request);
			const cleanup = () => {
				if (this.requests.get(senderKey) === request)
				{
					this.requests.delete(senderKey);
				}
			};
			request.then(cleanup, cleanup);

			return request;
		}
	}

	module.exports = { SignatureChoiceQueue };
});
