import { ajax } from 'main.core';

import {
	type AjaxError,
	type AjaxResponse,
	type CalendarSharingLinkResponse,
	type SignaturesResponse,
} from './types';

/** The `api` part follows the namespace registered in `mail/.settings.php`, as the neighbouring actions do. */
const Controller = 'mail.api.composeform';

type RequestData = Record<string, unknown>;

/**
 * Both members are optional: the action returns no data of its own, and a non-standard answer may come with no
 * list of the errors at all.
 */
export type SendMessageResponse = {
	status?: string,
	errors?: AjaxError[],
};

/** The address of the request comes from the `action` of the form, so nothing of it is named here. */
type SubmitConfig = {
	method: string,
	dataType: string,
	onsuccess(response: SendMessageResponse): void,
	onfailure(reason: string): void,
};

/** `ajax` of `main.core` carries no types, so the used calls are declared here. */
type Transport = {
	runAction<T>(action: string, config: { data: RequestData }): Promise<AjaxResponse<T>>,
	submitAjax(form: HTMLFormElement, config: SubmitConfig): void,
};

const transport = ajax as Transport;

function runAction<T>(action: string, data: RequestData = {}): Promise<AjaxResponse<T>>
{
	return transport.runAction<T>(`${Controller}.${action}`, { data });
}

/** Actions the form needs once it is already on the screen. */
export const Api = {
	/** Asked for anew after the slider of the signature settings is closed. */
	getSignatures(): Promise<AjaxResponse<SignaturesResponse>>
	{
		return runAction<SignaturesResponse>('getSignatures');
	},

	/** The action takes no parameters: it answers for the current user. */
	getCalendarSharingLink(): Promise<AjaxResponse<CalendarSharingLinkResponse>>
	{
		return runAction<CalendarSharingLinkResponse>('getCalendarSharingLink');
	},

	/**
	 * The request is the serialisation of the real server form: `multipart/form-data` to the address of its
	 * `action`, with the fields, the files of the uploader control and the `sessid` coming from the form itself.
	 * The action belongs to `bitrix:mail.client` and not to a controller of the module, so `runAction` does not
	 * fit it.
	 */
	sendMessage(form: HTMLFormElement): Promise<SendMessageResponse>
	{
		return new Promise((resolve, reject) => {
			transport.submitAjax(form, {
				method: 'POST',
				dataType: 'json',
				onsuccess: resolve,
				onfailure: (reason: string): void => {
					reject(new Error(`Compose form send request failed: ${reason}.`));
				},
			});
		});
	},
};
