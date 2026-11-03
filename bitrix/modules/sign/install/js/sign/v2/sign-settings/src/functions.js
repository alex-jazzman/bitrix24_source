import { Type } from 'main.core';
import { DocumentMode } from 'sign.type';

type WizardLike = {
	toggleBtnActiveState: (buttonId: string, isDisabled: boolean) => void,
};

type GroupPlaceholderValidationApi = {
	getDocumentGroupPlaceholderValidationStatus: (groupId: number) => Promise<{ ready: boolean }>,
};

type GroupPlaceholderValidationWaitOptions = {
	wait?: (timeout: number) => Promise<void>,
	maxAttempts?: number,
	isCancelled?: () => boolean,
	requestTimeout?: number,
};

export function decorateResultBeforeCompletion(
	innerCallback: () => Promise<boolean>,
	onSuccess: () => void | Promise<void>,
	onFail: () => void | Promise<void>,
): () => Promise<boolean>
{
	return async () => {
		let result = false;
		try
		{
			result = await innerCallback();
		}
		catch (e)
		{
			await onFail();
			throw e;
		}

		if (result)
		{
			await onSuccess();
		}
		else
		{
			await onFail();
		}

		return result;
	};
}

export function isTemplateMode(mode: string): boolean
{
	return mode === DocumentMode.template;
}

export function getFilledStringOrUndefined(value: string): string | undefined
{
	return Type.isStringFilled(value) ? value : undefined;
}

export function setInitialNextButtonState(wizard: WizardLike, uid?: string): void
{
	wizard.toggleBtnActiveState('next', !Type.isStringFilled(uid));
}

export async function waitForGroupPlaceholderValidation(
	api: GroupPlaceholderValidationApi,
	groupId: number,
	options: GroupPlaceholderValidationWaitOptions = {},
): Promise<boolean>
{
	const {
		wait = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout)),
		maxAttempts = 180,
		isCancelled = () => false,
		requestTimeout = 10000,
	} = options;

	for (let attempt = 0; attempt < maxAttempts; attempt++)
	{
		if (isCancelled())
		{
			return false;
		}

		let response = null;
		try
		{
			// eslint-disable-next-line no-await-in-loop
			response = await Promise.race([
				api.getDocumentGroupPlaceholderValidationStatus(groupId),
				new Promise((resolve) => setTimeout(() => resolve(null), requestTimeout)),
			]);
		}
		catch
		{
			return false;
		}

		if (!Type.isBoolean(response?.ready))
		{
			return false;
		}

		if (response.ready)
		{
			return true;
		}

		if (attempt + 1 < maxAttempts)
		{
			// eslint-disable-next-line no-await-in-loop
			await wait(1000);
		}
	}

	return false;
}
