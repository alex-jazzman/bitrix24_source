/**
 * @module im/messenger/application/lib/forward-message-manager/src/forward-message-operation
 */
jn.define('im/messenger/application/lib/forward-message-manager/src/forward-message-operation', (
	require,
	exports,
	module,
) => {
	const { ForwardDeliveryStatus } = require(
		'im/messenger/application/lib/forward-message-manager/src/result-mapper',
	);

	class ForwardMessageOperation
	{
		/**
		 * @param {ForwardMessageOperationOptions} options
		 */
		constructor({ operationId, fromDialogId, messageIds, recipients, uuidFactory })
		{
			this.id = operationId;
			this.fromDialogId = fromDialogId;
			this.messageIds = [...messageIds];
			this.recipients = recipients.map((recipient) => ({
				recipient: { ...recipient },
				status: ForwardDeliveryStatus.queued,
				requestOutcome: null,
				requestToken: 0,
				deliveries: this.messageIds.map((messageId) => ({
					messageId,
					uuid: uuidFactory(),
					status: ForwardDeliveryStatus.queued,
					failureCode: null,
					failureGroup: null,
					attempts: 0,
				})),
			}));
			this.interruptedByBackground = false;
			this.finalized = false;
			this.result = null;
			this.attemptKind = 'initial';
			this.completionResolver = null;
			this.releaseWhenFinalized = false;
		}

		getRecipient(dialogId)
		{
			return this.recipients.find(({ recipient }) => String(recipient.id) === String(dialogId)) ?? null;
		}

		getForwardIds(recipientState, deliveryUuids = null)
		{
			const uuidSet = deliveryUuids ? new Set(deliveryUuids) : null;

			return recipientState.deliveries.reduce((result, delivery) => {
				if (uuidSet && !uuidSet.has(delivery.uuid))
				{
					return result;
				}

				result[delivery.uuid] = delivery.messageId;

				return result;
			}, {});
		}

		getRetryTasks()
		{
			return this.recipients.map((recipientState) => {
				const deliveryUuids = recipientState.deliveries
					.filter((delivery) => this.#isDeliveryRetryable(recipientState, delivery))
					.map(({ uuid }) => uuid)
				;

				return {
					dialogId: recipientState.recipient.id,
					deliveryUuids,
				};
			}).filter(({ deliveryUuids }) => deliveryUuids.length > 0);
		}

		beginRetry(tasks)
		{
			this.finalized = false;
			this.attemptKind = 'retry';

			for (const task of tasks)
			{
				const recipientState = this.getRecipient(task.dialogId);
				recipientState.status = ForwardDeliveryStatus.queued;
				for (const delivery of recipientState.deliveries)
				{
					if (task.deliveryUuids.includes(delivery.uuid))
					{
						delivery.status = ForwardDeliveryStatus.queued;
					}
				}
			}

			return new Promise((resolve) => {
				this.completionResolver = resolve;
			});
		}

		resolveCompletion(result)
		{
			this.completionResolver?.(result);
			this.completionResolver = null;
		}

		cancelCompletion()
		{
			this.resolveCompletion(null);
		}

		isComplete()
		{
			return this.recipients.every(({ status }) => {
				return ![ForwardDeliveryStatus.queued, ForwardDeliveryStatus.inFlight].includes(status);
			});
		}

		#isDeliveryRetryable(recipientState, delivery)
		{
			const isUnknown = recipientState.requestOutcome === 'unknown'
				&& delivery.status === ForwardDeliveryStatus.unknown
			;

			return isUnknown
				|| (
					delivery.status === ForwardDeliveryStatus.failed
					&& ['retryable', 'storageFull'].includes(delivery.failureGroup)
				)
			;
		}
	}

	module.exports = { ForwardMessageOperation };
});
