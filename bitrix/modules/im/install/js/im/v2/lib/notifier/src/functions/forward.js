import { Runtime } from 'main.core';
import { type Balloon } from 'ui.notification';

type ForwardRecipientResult = {
	dialogTitle: string,
	state: string,
	displayReason?: string,
};

type ForwardOperationResult = {
	totalRecipients: number,
	successfulRecipients: number,
	hasRetryableDeliveries: boolean,
	recipients: ForwardRecipientResult[],
};

type ShowResultParams = {
	operationId: string,
	result: ForwardOperationResult,
	retry?: () => Promise<ForwardOperationResult>,
};

type ForwardNotifierContract = {
	showResult: (params: ShowResultParams) => Balloon,
	onComplete: (operationId: string, recipientCount: number) => Balloon,
};

const EXTENSION_NAME = 'im.v2.lib.notifier.forward';
let loadingPromise: ?Promise<ForwardNotifierContract> = null;

const loadForwardNotifier = async (): Promise<ForwardNotifierContract> => {
	if (!loadingPromise)
	{
		loadingPromise = Runtime.loadExtension(EXTENSION_NAME)
			.then(({ ForwardNotifier }) => ForwardNotifier)
			.catch((error) => {
				loadingPromise = null;

				throw error;
			})
		;
	}

	return loadingPromise;
};

export const ForwardNotifier = {
	async showResult(params: ShowResultParams): Promise<Balloon>
	{
		const notifier = await loadForwardNotifier();

		return notifier.showResult(params);
	},

	async onComplete(operationId: string, recipientCount: number): Promise<Balloon>
	{
		const notifier = await loadForwardNotifier();

		return notifier.onComplete(operationId, recipientCount);
	},
};
