import { ajax, Text, Type } from 'main.core';

import {
	type AjaxResponse,
	type GetSettingResponse,
	type MailboxOption,
	type SaveActiveFlag,
	type SaveSettingRequest,
	type SaveSettingResponse,
	type VacationAutoReplySetting,
} from './types';

/** The `api` part follows the namespace registered in `mail/.settings.php`, as neighbouring actions do. */
const CONTROLLER = 'mail.api.vacationautoreply';

export const ACTION_GET = `${CONTROLLER}.get`;
export const ACTION_SAVE = `${CONTROLLER}.save`;

type RequestData = Record<string, unknown>;

/** `ajax` of `main.core` carries no types, so the used call is declared here. */
type Transport = {
	runAction<T>(action: string, config: { data: RequestData }): Promise<AjaxResponse<T>>,
};

const transport = ajax as Transport;

function toRequestFlag(value: SaveSettingRequest['active'] | boolean): SaveActiveFlag
{
	return value === 1 || value === true ? 1 : 0;
}

/** Payload sent by the save action. */
export function buildSavePayload(request: SaveSettingRequest): RequestData
{
	return {
		mailboxId: request.mailboxId,
		active: toRequestFlag(request.active),
		startsAt: request.startsAt,
		endsAt: request.endsAt,
		timezoneId: request.timezoneId,
		body: request.body,
	};
}

/** Missing response fields produce a switched-off auto-reply setting. */
export function toSetting(raw: Partial<VacationAutoReplySetting> | null | undefined): VacationAutoReplySetting
{
	return {
		mailboxId: Text.toInteger(raw?.mailboxId),
		active: raw?.active === true,
		startsAt: toBound(raw?.startsAt),
		endsAt: toBound(raw?.endsAt),
		timezoneId: String(raw?.timezoneId ?? ''),
		body: String(raw?.body ?? ''),
		canEdit: raw?.canEdit === true,
	};
}

function toBound(value: string | null | undefined): string | null
{
	return Type.isStringFilled(value) ? value : null;
}

export function toMailboxes(raw: Partial<MailboxOption>[] | null | undefined): MailboxOption[]
{
	return (raw ?? [])
		.map((item: Partial<MailboxOption>): MailboxOption => ({
			id: Text.toInteger(item?.id),
			email: String(item?.email ?? ''),
		}))
		.filter((item: MailboxOption): boolean => item.id > 0)
	;
}

/**
 * The client only sends requests and reads their answers: the server owns the meaning and validation
 * of the setting.
 *
 * Both actions go through the standard `runAction` transport, that is form-encoded POST. The text of
 * the auto-reply is HTML and is read raw from the POST list on the server, so the request must not
 * become json; the read action carries its parameter the same way, since `runAction` puts `data`
 * into the body of the request and a GET would lose it.
 */
export const Api = {
	get(mailboxId: number): Promise<GetSettingResponse>
	{
		return transport
			.runAction<GetSettingResponse>(ACTION_GET, { data: { mailboxId } })
			.then((response: AjaxResponse<GetSettingResponse>): GetSettingResponse => ({
				setting: toSetting(response.data?.setting),
				mailboxes: toMailboxes(response.data?.mailboxes),
			}))
		;
	},

	save(request: SaveSettingRequest): Promise<SaveSettingResponse>
	{
		return transport
			.runAction<SaveSettingResponse>(ACTION_SAVE, { data: buildSavePayload(request) })
			.then((response: AjaxResponse<SaveSettingResponse>): SaveSettingResponse => ({
				setting: toSetting(response.data?.setting),
			}))
		;
	},
};
