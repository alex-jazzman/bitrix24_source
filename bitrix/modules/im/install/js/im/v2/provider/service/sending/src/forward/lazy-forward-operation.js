import { Runtime } from 'main.core';

import {
	type ForwardDeliveryResponse,
	type ForwardOperationResult,
	type ForwardRecipientResult,
	type ForwardUuidMap,
} from 'im.v2.provider.service.sending.forward';

type ForwardOperationOptions = {
	operationId: string,
	messageIds: number[],
	recipientDialogIds: string[],
	uuidFactory: () => string,
	deliver: (
		dialogId: string,
		forwardUuidMap: ForwardUuidMap,
		isRetry: boolean,
	) => Promise<ForwardDeliveryResponse>,
	getRecipientTitle?: (dialogId: string) => string,
	onRecipientResult?: (result: ForwardRecipientResult) => void,
};

type ForwardOperationContract = {
	run: () => Promise<ForwardOperationResult>,
	retry: () => Promise<ForwardOperationResult>,
	canRetry: () => boolean,
};

const EXTENSION_NAME = 'im.v2.provider.service.sending.forward';

export class LazyForwardOperation
{
	#options: ForwardOperationOptions;
	#operation: ?ForwardOperationContract = null;
	#loadingPromise: ?Promise<ForwardOperationContract> = null;

	constructor(options: ForwardOperationOptions)
	{
		this.#options = options;
	}

	async run(): Promise<ForwardOperationResult>
	{
		const operation = await this.#getOperation();

		return operation.run();
	}

	async retry(): Promise<ForwardOperationResult>
	{
		const operation = await this.#getOperation();

		return operation.retry();
	}

	canRetry(): boolean
	{
		return this.#operation?.canRetry() ?? false;
	}

	async #getOperation(): Promise<ForwardOperationContract>
	{
		if (this.#operation)
		{
			return this.#operation;
		}

		this.#loadingPromise ??= Runtime.loadExtension(EXTENSION_NAME).then(({ ForwardOperation }) => {
			return new ForwardOperation(this.#options);
		});
		try
		{
			this.#operation = await this.#loadingPromise;
		}
		catch (error)
		{
			this.#loadingPromise = null;

			throw error;
		}

		return this.#operation;
	}
}
