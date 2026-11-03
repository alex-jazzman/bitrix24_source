/**
 * @module im/messenger/application/lib/forward-message-manager/src/result-mapper
 */
jn.define('im/messenger/application/lib/forward-message-manager/src/result-mapper', (require, exports, module) => {
	const ForwardDeliveryStatus = Object.freeze({
		queued: 'queued',
		inFlight: 'inFlight',
		succeeded: 'succeeded',
		failed: 'failed',
		unknown: 'unknown',
	});

	const ForwardFailureGroup = Object.freeze({
		retryable: 'retryable',
		storageFull: 'storageFull',
		fileUnavailable: 'fileUnavailable',
		chatUnavailable: 'chatUnavailable',
		notWritable: 'notWritable',
	});

	const FAILURE_GROUP_BY_CODE = Object.freeze({
		ACCESS_DENIED: ForwardFailureGroup.notWritable,
		MESSAGE_ACCESS_DENIED: ForwardFailureGroup.notWritable,
		TEXT_FIELD_DISABLED: ForwardFailureGroup.notWritable,
		CHAT_NOT_FOUND: ForwardFailureGroup.chatUnavailable,
		DISK_NOT_INSTALLED: ForwardFailureGroup.fileUnavailable,
		FILE_NOT_FOUND: ForwardFailureGroup.fileUnavailable,
		STORAGE_QUOTA_EXCEEDED: ForwardFailureGroup.storageFull,
		SENDING_FAILED: ForwardFailureGroup.retryable,
		COPY_ERROR: ForwardFailureGroup.retryable,
		MESSAGE_DUPLICATED_BY_UUID: ForwardFailureGroup.retryable,
	});

	const FAILURE_GROUP_PRIORITY = [
		ForwardFailureGroup.retryable,
		ForwardFailureGroup.storageFull,
		ForwardFailureGroup.fileUnavailable,
		ForwardFailureGroup.chatUnavailable,
		ForwardFailureGroup.notWritable,
	];

	class ForwardResultMapper
	{
		static applyResponse(recipientState, deliveries, response = {})
		{
			const uuidMap = response?.uuidMap ?? {};
			const failureMap = response?.failureMap ?? {};

			for (const delivery of deliveries)
			{
				if (Object.prototype.hasOwnProperty.call(uuidMap, delivery.uuid))
				{
					this.#markSucceeded(delivery);

					continue;
				}

				if (Object.prototype.hasOwnProperty.call(failureMap, delivery.uuid))
				{
					const code = failureMap[delivery.uuid];
					this.#markFailed(delivery, code);

					continue;
				}

				this.#markUnknown(delivery);
			}

			this.#finalizeRecipient(recipientState);
		}

		static applyError(recipientState, deliveries, error)
		{
			const errors = Array.isArray(error) ? error : (Array.isArray(error?.errors) ? error.errors : [error]);
			const failureByUuid = new Map();
			let requestFailureCode = null;

			for (const item of errors.filter(Boolean))
			{
				const code = this.#normalizeCode(item?.code);
				const uuid = item?.customData?.uuid;
				if (uuid)
				{
					failureByUuid.set(String(uuid), code);
				}
				else if (!requestFailureCode)
				{
					requestFailureCode = code;
				}
			}

			for (const delivery of deliveries)
			{
				if (failureByUuid.has(delivery.uuid))
				{
					const code = failureByUuid.get(delivery.uuid);
					this.#markFailed(delivery, code);
				}
				else if (requestFailureCode)
				{
					this.#markFailed(delivery, requestFailureCode);
				}
				else
				{
					this.#markUnknown(delivery);
				}
			}

			this.#finalizeRecipient(recipientState);
		}

		static markInterrupted(recipientState)
		{
			for (const delivery of recipientState.deliveries)
			{
				if ([ForwardDeliveryStatus.queued, ForwardDeliveryStatus.inFlight].includes(delivery.status))
				{
					this.#markUnknown(delivery);
				}
			}

			this.#finalizeRecipient(recipientState);
		}

		static createOperationResult(operation)
		{
			const recipients = operation.recipients.map((recipientState) => {
				const succeeded = recipientState.deliveries.every((delivery) => {
					return delivery.status === ForwardDeliveryStatus.succeeded;
				});
				const reason = succeeded ? null : this.#getRecipientReason(recipientState);

				return {
					recipient: { ...recipientState.recipient },
					succeeded,
					reason,
					retryable: [ForwardFailureGroup.retryable, ForwardFailureGroup.storageFull].includes(reason),
					requestOutcome: recipientState.requestOutcome,
					deliveries: recipientState.deliveries.map((delivery) => ({ ...delivery })),
				};
			});
			const succeededCount = recipients.filter(({ succeeded }) => succeeded).length;

			return {
				operationId: operation.id,
				totalRecipients: recipients.length,
				succeededRecipients: succeededCount,
				failedRecipients: recipients.filter(({ succeeded }) => !succeeded),
				recipients,
				interruptedByBackground: operation.interruptedByBackground,
			};
		}

		static #markSucceeded(delivery)
		{
			delivery.status = ForwardDeliveryStatus.succeeded;
			delivery.failureCode = null;
			delivery.failureGroup = null;
		}

		static #markFailed(delivery, code)
		{
			const normalizedCode = this.#normalizeCode(code);
			delivery.status = ForwardDeliveryStatus.failed;
			delivery.failureCode = normalizedCode;
			delivery.failureGroup = FAILURE_GROUP_BY_CODE[normalizedCode] ?? ForwardFailureGroup.retryable;
		}

		static #markUnknown(delivery)
		{
			delivery.status = ForwardDeliveryStatus.unknown;
			delivery.failureCode = null;
			delivery.failureGroup = ForwardFailureGroup.retryable;
		}

		static #normalizeCode(code)
		{
			return typeof code === 'string' && code.length > 0 ? code : 'UNKNOWN';
		}

		static #finalizeRecipient(recipientState)
		{
			const hasUnknown = recipientState.deliveries.some(({ status }) => status === ForwardDeliveryStatus.unknown);
			const isSucceeded = recipientState.deliveries.every(({ status }) => {
				return status === ForwardDeliveryStatus.succeeded;
			});

			recipientState.requestOutcome = hasUnknown ? 'unknown' : 'known';
			recipientState.status = isSucceeded ? ForwardDeliveryStatus.succeeded : ForwardDeliveryStatus.failed;
		}

		static #getRecipientReason(recipientState)
		{
			const groups = new Set(recipientState.deliveries.map(({ failureGroup }) => failureGroup).filter(Boolean));

			return FAILURE_GROUP_PRIORITY.find((group) => groups.has(group)) ?? ForwardFailureGroup.retryable;
		}
	}

	module.exports = {
		ForwardResultMapper,
		ForwardDeliveryStatus,
		ForwardFailureGroup,
	};
});
