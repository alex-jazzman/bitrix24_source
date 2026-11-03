import { Type } from 'main.core';

import {
	ForwardFailureGroup,
	ForwardMessageState,
	ForwardRecipientState,
	MAX_CONCURRENT_RECIPIENTS,
	getForwardFailureGroup,
	isForwardFailureRetryable,
} from './const';
import {
	type ForwardDeliveryResponse,
	type ForwardMessageResult,
	type ForwardOperationResult,
	type ForwardRecipientResult,
	type ForwardUuidMap,
} from './types';

type ForwardOperationOptions = {
	operationId: string,
	messageIds: number[],
	recipientDialogIds: string[],
	uuidFactory: () => string,
	deliver: (dialogId: string, forwardUuidMap: ForwardUuidMap, isRetry: boolean) => Promise<ForwardDeliveryResponse>,
	getRecipientTitle?: (dialogId: string) => string,
	onRecipientResult?: (result: ForwardRecipientResult) => void,
};

type ForwardRecipientRequest = {
	dialogId: string,
	forwardUuidMap: ForwardUuidMap,
};

export class ForwardOperation
{
	#operationId: string;
	#deliver: (dialogId: string, forwardUuidMap: ForwardUuidMap, isRetry: boolean) => Promise<ForwardDeliveryResponse>;
	#getRecipientTitle: (dialogId: string) => string;
	#onRecipientResult: ?(result: ForwardRecipientResult) => void;
	#recipientDialogIds: string[];
	#uuidMaps: Map<string, ForwardUuidMap>;
	#recipientResults: Map<string, ForwardRecipientResult> = new Map();
	#attempt = 0;
	#runPromise: ?Promise<ForwardOperationResult> = null;
	#retryPromise: ?Promise<ForwardOperationResult> = null;

	constructor(options: ForwardOperationOptions)
	{
		this.#operationId = options.operationId;
		this.#deliver = options.deliver;
		this.#getRecipientTitle = options.getRecipientTitle ?? ((dialogId) => dialogId);
		this.#onRecipientResult = options.onRecipientResult;
		this.#recipientDialogIds = [...options.recipientDialogIds];
		this.#uuidMaps = this.#createUuidMaps(options.messageIds, options.uuidFactory);
	}

	run(): Promise<ForwardOperationResult>
	{
		if (this.#runPromise)
		{
			return this.#runPromise;
		}

		const requests = this.#recipientDialogIds.map((dialogId) => ({
			dialogId,
			forwardUuidMap: this.#uuidMaps.get(dialogId) ?? {},
		}));
		this.#runPromise = this.#execute(requests, false);

		return this.#runPromise;
	}

	retry(): Promise<ForwardOperationResult>
	{
		if (this.#retryPromise)
		{
			return this.#retryPromise;
		}

		const requests = this.#createRetryRequests();
		if (requests.length === 0)
		{
			return Promise.resolve(this.#buildOperationResult(true));
		}

		this.#retryPromise = this.#execute(requests, true).finally(() => {
			this.#retryPromise = null;
		});

		return this.#retryPromise;
	}

	canRetry(): boolean
	{
		return this.#createRetryRequests().length > 0;
	}

	async #execute(requests: ForwardRecipientRequest[], isRetry: boolean): Promise<ForwardOperationResult>
	{
		this.#attempt++;
		let nextRecipientIndex = 0;

		const worker = async (): Promise<void> => {
			const recipientIndex = nextRecipientIndex++;
			if (recipientIndex >= requests.length)
			{
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
		await Promise.all(Array.from({ length: workersCount }, () => worker()));

		return this.#buildOperationResult(isRetry);
	}

	async #deliverToRecipient(request: ForwardRecipientRequest, isRetry: boolean): Promise<ForwardRecipientResult>
	{
		let response: ForwardDeliveryResponse = {};

		try
		{
			response = await this.#deliver(request.dialogId, request.forwardUuidMap, isRetry);
		}
		catch (errors)
		{
			response = { errors: Type.isArray(errors) ? errors : [] };
		}

		return this.#normalizeRecipientResult(request.dialogId, request.forwardUuidMap, response);
	}

	#normalizeRecipientResult(
		dialogId: string,
		forwardUuidMap: ForwardUuidMap,
		response: ForwardDeliveryResponse,
	): ForwardRecipientResult
	{
		const requestedUuids = Object.keys(forwardUuidMap);
		const resultByUuid: Map<string, ForwardMessageResult> = new Map();

		Object.entries(response?.uuidMap ?? {}).forEach(([uuid, deliveredMessageId]) => {
			if (!Object.hasOwn(forwardUuidMap, uuid))
			{
				return;
			}

			resultByUuid.set(uuid, this.#createSuccess(uuid, forwardUuidMap[uuid], deliveredMessageId));
		});

		Object.entries(response?.failureMap ?? {}).forEach(([uuid, code]) => {
			this.#setFailure(resultByUuid, forwardUuidMap, uuid, code);
		});

		const errors = Type.isArray(response?.errors) ? response.errors : [];
		errors.forEach((error) => {
			const uuid = error?.customData?.uuid;
			if (Type.isStringFilled(uuid))
			{
				this.#setFailure(resultByUuid, forwardUuidMap, uuid, error.code);

				return;
			}

			requestedUuids.forEach((requestedUuid) => {
				this.#setFailure(resultByUuid, forwardUuidMap, requestedUuid, error?.code);
			});
		});

		const messages = requestedUuids.map((uuid): ForwardMessageResult => {
			return resultByUuid.get(uuid) ?? {
				uuid,
				messageId: forwardUuidMap[uuid],
				state: ForwardMessageState.unknown,
				retryable: true,
				failureGroup: ForwardFailureGroup.transientUnknown,
			};
		});

		return this.#createRecipientResult(dialogId, messages);
	}

	#setFailure(
		resultByUuid: Map<string, ForwardMessageResult>,
		forwardUuidMap: ForwardUuidMap,
		uuid: string,
		code: ?string,
	): void
	{
		if (!Object.hasOwn(forwardUuidMap, uuid) || resultByUuid.has(uuid))
		{
			return;
		}

		const normalizedCode = Type.isStringFilled(code) ? code : 'UNKNOWN_CODE';
		resultByUuid.set(uuid, {
			uuid,
			messageId: forwardUuidMap[uuid],
			state: ForwardMessageState.failure,
			code: normalizedCode,
			retryable: isForwardFailureRetryable(normalizedCode),
			failureGroup: getForwardFailureGroup(normalizedCode),
		});
	}

	#createSuccess(uuid: string, messageId: number, deliveredMessageId?: number): ForwardMessageResult
	{
		return {
			uuid,
			messageId,
			state: ForwardMessageState.success,
			deliveredMessageId,
			retryable: false,
		};
	}

	#createRecipientResult(dialogId: string, messages: ForwardMessageResult[]): ForwardRecipientResult
	{
		return {
			dialogId,
			dialogTitle: this.#getRecipientTitle(dialogId),
			state: this.#getRecipientState(messages),
			displayReason: this.#getDisplayReason(messages),
			messages,
		};
	}

	#mergeRecipientResult(attemptResult: ForwardRecipientResult): ForwardRecipientResult
	{
		const previousResult = this.#recipientResults.get(attemptResult.dialogId);
		if (!previousResult)
		{
			return attemptResult;
		}

		const resultByUuid = new Map(attemptResult.messages.map((message) => [message.uuid, message]));
		const messages = previousResult.messages.map((message) => resultByUuid.get(message.uuid) ?? message);

		return this.#createRecipientResult(attemptResult.dialogId, messages);
	}

	#getRecipientState(messages: ForwardMessageResult[]): string
	{
		if (messages.every(({ state }) => state === ForwardMessageState.success))
		{
			return ForwardRecipientState.success;
		}

		if (messages.some(({ state }) => state === ForwardMessageState.unknown))
		{
			return ForwardRecipientState.unknown;
		}

		return ForwardRecipientState.failure;
	}

	#getDisplayReason(messages: ForwardMessageResult[]): ?string
	{
		const groups = new Set(messages.map(({ failureGroup }) => failureGroup).filter(Boolean));
		const priority = [
			ForwardFailureGroup.transientUnknown,
			ForwardFailureGroup.storage,
			ForwardFailureGroup.fileUnavailable,
			ForwardFailureGroup.chatUnavailable,
			ForwardFailureGroup.notWritable,
		];

		return priority.find((group) => groups.has(group)) ?? null;
	}

	#createRetryRequests(): ForwardRecipientRequest[]
	{
		return this.#recipientDialogIds.map((dialogId): ?ForwardRecipientRequest => {
			const recipientResult = this.#recipientResults.get(dialogId);
			if (!recipientResult)
			{
				return null;
			}

			const forwardUuidMap = {};
			recipientResult.messages.forEach((message) => {
				if (message.state === ForwardMessageState.unknown || message.retryable)
				{
					forwardUuidMap[message.uuid] = message.messageId;
				}
			});

			return Object.keys(forwardUuidMap).length > 0 ? { dialogId, forwardUuidMap } : null;
		}).filter(Boolean);
	}

	#buildOperationResult(isRetry: boolean): ForwardOperationResult
	{
		const recipients = this.#recipientDialogIds.map((dialogId) => this.#recipientResults.get(dialogId)).filter(Boolean);

		return {
			operationId: this.#operationId,
			attempt: this.#attempt,
			isRetry,
			totalRecipients: recipients.length,
			successfulRecipients: recipients.filter(({ state }) => state === ForwardRecipientState.success).length,
			hasRetryableDeliveries: recipients.some(({ messages }) => {
				return messages.some(({ state, retryable }) => state === ForwardMessageState.unknown || retryable);
			}),
			recipients,
		};
	}

	#createUuidMaps(messageIds: number[], uuidFactory: () => string): Map<string, ForwardUuidMap>
	{
		const orderedMessageIds = [...messageIds].sort((firstId, secondId) => firstId - secondId);
		const uuidMaps = new Map();

		this.#recipientDialogIds.forEach((dialogId) => {
			const forwardUuidMap = {};
			orderedMessageIds.forEach((messageId) => {
				forwardUuidMap[uuidFactory()] = messageId;
			});
			uuidMaps.set(dialogId, forwardUuidMap);
		});

		return uuidMaps;
	}
}
