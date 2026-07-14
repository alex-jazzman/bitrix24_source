import { Dom } from 'main.core';

import { type AnyButtonBlock } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

import { handlerRegistry } from './handler-registry.js';

type ButtonClickParams = {
	event: PointerEvent,
	message: ImModelMessage,
	dialogId: string,
	button: AnyButtonBlock,
};

const ButtonTypeHandler = {
	eventButton: eventButtonHandler,
	linkButton: linkButtonHandler,
};

export const handleClick = (params: ButtonClickParams) => {
	const { button: { type } } = params;

	if (!ButtonTypeHandler[type])
	{
		return;
	}

	ButtonTypeHandler[type](params);
};

function eventButtonHandler(params: ButtonClickParams)
{
	const { button, message, dialogId } = params;
	const { actionId, actionParams } = button;
	const handler = handlerRegistry[actionId];
	if (handler)
	{
		handler({ actionId, actionParams, message, dialogId });
	}
}

function linkButtonHandler(params: ButtonClickParams)
{
	const { button: { url } } = params;
	const isUrl = Utils.text.checkUrl(url);
	if (!isUrl)
	{
		return;
	}

	// we can't use window.open(), because bindings will not work
	const a = Dom.create({
		tag: 'a',
		style: { display: 'none' },
		attrs: { href: url },
	});
	Dom.append(a, document.body);
	a.click();
	Dom.remove(a);
}
