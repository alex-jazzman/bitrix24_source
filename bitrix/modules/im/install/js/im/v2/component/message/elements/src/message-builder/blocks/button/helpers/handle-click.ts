import { Dom } from 'main.core';

import { type AnyButtonBlock, type EventButtonBlockType } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

import { handlerRegistry } from './handler-registry';

type ButtonClickParams = {
	event: PointerEvent;
	message: ImModelMessage;
	dialogId: string;
	button: AnyButtonBlock;
};

const ButtonTypeHandler: Partial<Record<string, (params: ButtonClickParams) => void>> = {
	eventButton: eventButtonHandler,
	linkButton: linkButtonHandler,
	requestButton: requestButtonHandler,
};

export const handleClick = (params: ButtonClickParams) => {
	const {
		button: { type },
	} = params;

	if (!ButtonTypeHandler[type])
	{
		return;
	}

	ButtonTypeHandler[type](params);
};

function eventButtonHandler(params: ButtonClickParams)
{
	const { button, message, dialogId } = params;
	const { actionId, actionParams } = button as EventButtonBlockType;
	const handler = handlerRegistry[actionId];
	if (handler)
	{
		handler({ actionId, actionParams, message, dialogId });
	}
}

function requestButtonHandler(): void
{
	// A `requestButton` submits the enclosing `form` block, which requires the local `values`
	// state of the `FormBlock` Vue instance — not available in this stateless routing helper.
	// `FormBlock` intercepts the click (via ButtonBlock's `click` emit) and drives the REST
	// submit itself. Registering the type here is intentional: it keeps routing explicit and
	// guarantees a `requestButton` never falls into the `eventButton` -> `handlerRegistry` path.
}

function linkButtonHandler(params: ButtonClickParams)
{
	const { url } = params.button as { url: string };
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
	a!.click();
	Dom.remove(a);
}
