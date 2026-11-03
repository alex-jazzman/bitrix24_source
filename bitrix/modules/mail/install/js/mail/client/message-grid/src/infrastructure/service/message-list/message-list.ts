import { ajax, Type } from 'main.core';

import { GridMode, type GridModeValue, type GridScreen } from '../../../const';
import { type GridPagePayload } from '../../../model/grid/types';
import { mapDraftPage, mapMessagePage } from './mappers';
import {
	type DraftPageResponse,
	type MessageListAjaxError,
	type MessageListAjaxResponse,
	type MessagePageResponse,
} from './types';

/** The `api` part follows the namespace registered in `mail/.settings.php`, as the neighbouring actions do. */
const Controller = 'mail.api.messagelist';

type RequestData = Record<string, unknown>;

/** `ajax` of `main.core` carries no types, so the used call is declared here. */
type Transport = {
	runAction<T>(
		action: string,
		config: { method: 'POST', data: RequestData },
	): Promise<MessageListAjaxResponse<T>>,
};

const transport = ajax as Transport;

/**
 * A page the server refused: the mailbox is not the caller's, the plan does not allow fetching, the
 * internal drafts are off, or the screen named itself with nothing. Which of them it was decides
 * what the grid shows next, so the code travels beside the message.
 */
export class MessageListApiError extends Error
{
	readonly errors: MessageListAjaxError[];
	readonly code: string | null;

	constructor(errors: MessageListAjaxError[] = [])
	{
		super(errors[0]?.message ?? 'Mail message list request failed.');
		this.name = 'MessageListApiError';
		this.errors = errors;
		this.code = errors[0]?.code === undefined ? null : String(errors[0].code);
	}
}

/** The plan stopped the mailbox from fetching (`MessageList::ERROR_SYNC_UNAVAILABLE`). */
const SyncUnavailableCode = 'MAILBOX_SYNC_UNAVAILABLE';

/** The page lies past the end of what the list answers for (`MessageList::ERROR_PAGE_OUT_OF_RANGE`). */
const PageOutOfRangeCode = 'PAGE_OUT_OF_RANGE';

/**
 * Whether the plan refused the page rather than the network or the screen. Asking again is offered
 * on every other failure, and never helps on this one.
 */
export function isSyncUnavailable(reason: unknown): boolean
{
	return reason instanceof MessageListApiError && reason.code === SyncUnavailableCode;
}

/**
 * Whether the list simply ends here. The button is gone before this is met; it answers a page asked
 * for anyway - by a screen standing since before the ceiling moved, or by a caller of its own.
 */
export function isPageOutOfRange(reason: unknown): boolean
{
	return reason instanceof MessageListApiError && reason.code === PageOutOfRangeCode;
}

function getErrors(reason: unknown): MessageListAjaxError[]
{
	if (!Type.isObjectLike(reason))
	{
		return [];
	}

	const errors = (reason as { errors?: unknown }).errors;

	return Type.isArray(errors) ? errors as MessageListAjaxError[] : [];
}

async function runAction<T>(action: string, data: RequestData): Promise<T>
{
	try
	{
		const response = await transport.runAction<T>(`${Controller}.${action}`, { method: 'POST', data });
		if (response.status === 'error' || response.data === undefined)
		{
			throw new MessageListApiError(response.errors);
		}

		return response.data;
	}
	catch (error)
	{
		throw new MessageListApiError(getErrors(error));
	}
}

/**
 * Both fields of an ordinary folder travel empty, and an empty one is not the same as an absent one:
 * `virtual` names the all mail mode and `listSection` a section that is not a folder at all.
 */
function messageRequest(screen: GridScreen, page: number): RequestData
{
	const data: RequestData = {
		gridId: screen.gridId,
		filterId: screen.filterId,
		mailboxId: screen.mailboxId,
		page,
	};

	if (screen.virtual)
	{
		data.virtual = screen.virtual;
	}

	if (screen.listSection)
	{
		data.listSection = screen.listSection;
	}

	return data;
}

/** The drafts of the user depend neither on the folder nor on the section, and the action takes neither. */
function draftRequest(screen: GridScreen, page: number): RequestData
{
	const { gridId, filterId, mailboxId } = screen;

	return { gridId, filterId, mailboxId, page };
}

/** Pages of the list after the first one; the first comes with the markup of the screen. */
export const MessageListApi = {
	async getPage(screen: GridScreen, page: number): Promise<GridPagePayload>
	{
		return mapMessagePage(
			await runAction<MessagePageResponse>('getPage', messageRequest(screen, page)),
		);
	},

	async getDraftPage(screen: GridScreen, page: number): Promise<GridPagePayload>
	{
		return mapDraftPage(
			await runAction<DraftPageResponse>('getDraftPage', draftRequest(screen, page)),
		);
	},

	/** The page of whichever of the two lists a grid draws: the action follows the mode of the grid. */
	async getListPage(mode: GridModeValue, screen: GridScreen, page: number): Promise<GridPagePayload>
	{
		return mode === GridMode.Draft
			? MessageListApi.getDraftPage(screen, page)
			: MessageListApi.getPage(screen, page);
	},
};
