import { Type } from 'main.core';
import { BBCodeParser } from 'ui.bbcode.parser';

const ENTITY_TYPE = 'WORK_REPORT';

const BLOCK_TAGS = new Set(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);

const collectText = (node: Object): string => {
	const name = node.getName();
	if (name === '#text')
	{
		return String(node.getContent() ?? '');
	}
	if (name === '#linebreak')
	{
		return '\n';
	}
	if (name === '#tab')
	{
		return '\t';
	}

	const inner = node.getChildren().map(collectText).join('');
	if (BLOCK_TAGS.has(name.toLowerCase()))
	{
		return `${inner}\n`;
	}

	return inner;
};

const stripBbcode = (text: string): string => {
	const preprocessed = String(text).replace(/\[br\s*\/?\]/gi, '\n');
	const root = new BBCodeParser().parse(preprocessed);

	return collectText(root).trim();
};

const callRest = (method: string, params: Object): Promise<?Object> => new Promise((resolve): void => {
	const rest = window.BX?.rest;
	if (!rest?.callMethod)
	{
		console.error('discuss-chat: BX.rest is not available');
		resolve(null);

		return;
	}

	rest.callMethod(method, params, (result: Object): void => {
		const error = result?.error?.();
		if (error)
		{
			console.error(`discuss-chat: ${method} failed`, error);
			resolve(null);

			return;
		}
		resolve(result?.data?.() ?? null);
	});
});

export type OpenDiscussChatParams = {
	userIds: number[],
	entityId: number | string,
	message?: ?string,
	title?: ?string,
};

export const openDiscussChat = async (params: OpenDiscussChatParams): Promise<void> => {
	const restParams = {
		ENTITY_TYPE,
		ENTITY_ID: String(params.entityId),
	};

	const existing = await callRest('im.chat.get', restParams);
	let chatId = Number(existing?.ID ?? (Type.isNumber(existing) ? existing : 0));

	if (chatId <= 0)
	{
		const addParams: Object = {
			USERS: params.userIds,
			...restParams,
		};
		if (params.message)
		{
			const stripped = stripBbcode(params.message);
			if (stripped)
			{
				addParams.MESSAGE = stripped;
			}
		}

		if (params.title)
		{
			addParams.TITLE = params.title;
		}

		const created = await callRest('im.chat.add', addParams);
		chatId = Number(created?.ID ?? (Type.isNumber(created) ? created : 0));
	}

	if (chatId <= 0)
	{
		console.error('discuss-chat: could not resolve chatId');

		return;
	}

	const dialogId = `chat${chatId}`;
	const messengerHost = resolveMessengerHost();

	if (Type.isFunction(messengerHost?.BXIM?.openMessenger))
	{
		messengerHost.BXIM.openMessenger(dialogId);

		return;
	}

	if (Type.isFunction(messengerHost?.BX?.MessengerCommon?.openDialog))
	{
		messengerHost.BX.MessengerCommon.openDialog(dialogId);

		return;
	}

	console.error('discuss-chat: messenger API not found on window');
};

const resolveMessengerHost = (): any => {
	try
	{
		if (window.top && window.top !== window && window.top.BXIM)
		{
			return window.top;
		}
	}
	catch (e)
	{
		console.error('discuss-chat: resolveMessengerHost not work');
	}

	return window;
};
