/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {};
(function (exports, main_core) {
	'use strict';

	const MAX_CONCURRENT_RECIPIENTS = 3;
	const ForwardMessageState = {
		success: 'success',
		failure: 'failure',
		unknown: 'unknown'
	};
	const ForwardRecipientState = {
		success: 'success',
		failure: 'failure',
		unknown: 'unknown'
	};
	const ForwardFailureGroup = {
		transientUnknown: 'transientUnknown',
		storage: 'storage',
		fileUnavailable: 'fileUnavailable',
		chatUnavailable: 'chatUnavailable',
		notWritable: 'notWritable'
	};
	const FileUnavailableFailureCode = new Set(['DISK_NOT_INSTALLED', 'FILE_NOT_FOUND']);
	const NonRetryableFailureCode = new Set(['ACCESS_DENIED', 'MESSAGE_ACCESS_DENIED', 'TEXT_FIELD_DISABLED', 'CHAT_NOT_FOUND', ...FileUnavailableFailureCode]);
	const isForwardFailureRetryable = code => {
		return !NonRetryableFailureCode.has(code);
	};
	const getForwardFailureGroup = code => {
		if (code === 'STORAGE_QUOTA_EXCEEDED') {
			return ForwardFailureGroup.storage;
		}
		if (code === 'CHAT_NOT_FOUND') {
			return ForwardFailureGroup.chatUnavailable;
		}
		if (FileUnavailableFailureCode.has(code)) {
			return ForwardFailureGroup.fileUnavailable;
		}
		if (NonRetryableFailureCode.has(code)) {
			return ForwardFailureGroup.notWritable;
		}
		return ForwardFailureGroup.transientUnknown;
	};

	class ForwardOperation {
		#operationId;
		#deliver;
		#getRecipientTitle;
		#onRecipientResult;
		#recipientDialogIds;
		#uuidMaps;
		#recipientResults = new Map();
		#attempt = 0;
		#runPromise = null;
		#retryPromise = null;
		constructor(options) {
			this.#operationId = options.operationId;
			this.#deliver = options.deliver;
			this.#getRecipientTitle = options.getRecipientTitle ?? (dialogId => dialogId);
			this.#onRecipientResult = options.onRecipientResult;
			this.#recipientDialogIds = [...options.recipientDialogIds];
			this.#uuidMaps = this.#createUuidMaps(options.messageIds, options.uuidFactory);
		}
		run() {
			if (this.#runPromise) {
				return this.#runPromise;
			}
			const requests = this.#recipientDialogIds.map(dialogId => ({
				dialogId,
				forwardUuidMap: this.#uuidMaps.get(dialogId) ?? {}
			}));
			this.#runPromise = this.#execute(requests, false);
			return this.#runPromise;
		}
		retry() {
			if (this.#retryPromise) {
				return this.#retryPromise;
			}
			const requests = this.#createRetryRequests();
			if (requests.length === 0) {
				return Promise.resolve(this.#buildOperationResult(true));
			}
			this.#retryPromise = this.#execute(requests, true).finally(() => {
				this.#retryPromise = null;
			});
			return this.#retryPromise;
		}
		canRetry() {
			return this.#createRetryRequests().length > 0;
		}
		async #execute(requests, isRetry) {
			this.#attempt++;
			let nextRecipientIndex = 0;
			const worker = async () => {
				const recipientIndex = nextRecipientIndex++;
				if (recipientIndex >= requests.length) {
					return;
				}
				const request = requests[recipientIndex];
				const attemptResult = await this.#deliverToRecipient(request, isRetry);
				const result = this.#mergeRecipientResult(attemptResult);
				this.#recipientResults.set(request.dialogId, result);
				this.#onRecipientResult?.(attemptResult);
				await worker();
			};
			const workersCount = Math.min(MAX_CONCURRENT_RECIPIENTS, requests.length);
			await Promise.all(Array.from({
				length: workersCount
			}, () => worker()));
			return this.#buildOperationResult(isRetry);
		}
		async #deliverToRecipient(request, isRetry) {
			let response = {};
			try {
				response = await this.#deliver(request.dialogId, request.forwardUuidMap, isRetry);
			} catch (errors) {
				response = {
					errors: main_core.Type.isArray(errors) ? errors : []
				};
			}
			return this.#normalizeRecipientResult(request.dialogId, request.forwardUuidMap, response);
		}
		#normalizeRecipientResult(dialogId, forwardUuidMap, response) {
			const requestedUuids = Object.keys(forwardUuidMap);
			const resultByUuid = new Map();
			Object.entries(response?.uuidMap ?? {}).forEach(([uuid, deliveredMessageId]) => {
				if (!Object.hasOwn(forwardUuidMap, uuid)) {
					return;
				}
				resultByUuid.set(uuid, this.#createSuccess(uuid, forwardUuidMap[uuid], deliveredMessageId));
			});
			Object.entries(response?.failureMap ?? {}).forEach(([uuid, code]) => {
				this.#setFailure(resultByUuid, forwardUuidMap, uuid, code);
			});
			const errors = main_core.Type.isArray(response?.errors) ? response.errors : [];
			errors.forEach(error => {
				const uuid = error?.customData?.uuid;
				if (main_core.Type.isStringFilled(uuid)) {
					this.#setFailure(resultByUuid, forwardUuidMap, uuid, error.code);
					return;
				}
				requestedUuids.forEach(requestedUuid => {
					this.#setFailure(resultByUuid, forwardUuidMap, requestedUuid, error?.code);
				});
			});
			const messages = requestedUuids.map(uuid => {
				return resultByUuid.get(uuid) ?? {
					uuid,
					messageId: forwardUuidMap[uuid],
					state: ForwardMessageState.unknown,
					retryable: true,
					failureGroup: ForwardFailureGroup.transientUnknown
				};
			});
			return this.#createRecipientResult(dialogId, messages);
		}
		#setFailure(resultByUuid, forwardUuidMap, uuid, code) {
			if (!Object.hasOwn(forwardUuidMap, uuid) || resultByUuid.has(uuid)) {
				return;
			}
			const normalizedCode = main_core.Type.isStringFilled(code) ? code : 'UNKNOWN_CODE';
			resultByUuid.set(uuid, {
				uuid,
				messageId: forwardUuidMap[uuid],
				state: ForwardMessageState.failure,
				code: normalizedCode,
				retryable: isForwardFailureRetryable(normalizedCode),
				failureGroup: getForwardFailureGroup(normalizedCode)
			});
		}
		#createSuccess(uuid, messageId, deliveredMessageId) {
			return {
				uuid,
				messageId,
				state: ForwardMessageState.success,
				deliveredMessageId,
				retryable: false
			};
		}
		#createRecipientResult(dialogId, messages) {
			return {
				dialogId,
				dialogTitle: this.#getRecipientTitle(dialogId),
				state: this.#getRecipientState(messages),
				displayReason: this.#getDisplayReason(messages),
				messages
			};
		}
		#mergeRecipientResult(attemptResult) {
			const previousResult = this.#recipientResults.get(attemptResult.dialogId);
			if (!previousResult) {
				return attemptResult;
			}
			const resultByUuid = new Map(attemptResult.messages.map(message => [message.uuid, message]));
			const messages = previousResult.messages.map(message => resultByUuid.get(message.uuid) ?? message);
			return this.#createRecipientResult(attemptResult.dialogId, messages);
		}
		#getRecipientState(messages) {
			if (messages.every(({
				state
			}) => state === ForwardMessageState.success)) {
				return ForwardRecipientState.success;
			}
			if (messages.some(({
				state
			}) => state === ForwardMessageState.unknown)) {
				return ForwardRecipientState.unknown;
			}
			return ForwardRecipientState.failure;
		}
		#getDisplayReason(messages) {
			const groups = new Set(messages.map(({
				failureGroup
			}) => failureGroup).filter(Boolean));
			const priority = [ForwardFailureGroup.transientUnknown, ForwardFailureGroup.storage, ForwardFailureGroup.fileUnavailable, ForwardFailureGroup.chatUnavailable, ForwardFailureGroup.notWritable];
			return priority.find(group => groups.has(group)) ?? null;
		}
		#createRetryRequests() {
			return this.#recipientDialogIds.map(dialogId => {
				const recipientResult = this.#recipientResults.get(dialogId);
				if (!recipientResult) {
					return null;
				}
				const forwardUuidMap = {};
				recipientResult.messages.forEach(message => {
					if (message.state === ForwardMessageState.unknown || message.retryable) {
						forwardUuidMap[message.uuid] = message.messageId;
					}
				});
				return Object.keys(forwardUuidMap).length > 0 ? {
					dialogId,
					forwardUuidMap
				} : null;
			}).filter(Boolean);
		}
		#buildOperationResult(isRetry) {
			const recipients = this.#recipientDialogIds.map(dialogId => this.#recipientResults.get(dialogId)).filter(Boolean);
			return {
				operationId: this.#operationId,
				attempt: this.#attempt,
				isRetry,
				totalRecipients: recipients.length,
				successfulRecipients: recipients.filter(({
					state
				}) => state === ForwardRecipientState.success).length,
				hasRetryableDeliveries: recipients.some(({
					messages
				}) => {
					return messages.some(({
						state,
						retryable
					}) => state === ForwardMessageState.unknown || retryable);
				}),
				recipients
			};
		}
		#createUuidMaps(messageIds, uuidFactory) {
			const orderedMessageIds = [...messageIds].sort((firstId, secondId) => firstId - secondId);
			const uuidMaps = new Map();
			this.#recipientDialogIds.forEach(dialogId => {
				const forwardUuidMap = {};
				orderedMessageIds.forEach(messageId => {
					forwardUuidMap[uuidFactory()] = messageId;
				});
				uuidMaps.set(dialogId, forwardUuidMap);
			});
			return uuidMaps;
		}
	}

	exports.ForwardOperation = ForwardOperation;

})(this.BX.Messenger.v2.Service.SendingForward = this.BX.Messenger.v2.Service.SendingForward || {}, BX);
//# sourceMappingURL=forward.bundle.js.map
