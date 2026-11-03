import { Dom, Tag, Text } from 'main.core';
import { Popup } from 'main.popup';

import { type GridMessage, TestId } from '../../const';

const PopupId = 'mail-message-grid-screen-messages';

/** Kinds a word of the screen is drawn in; anything else is drawn as an ordinary one. */
const KnownKinds = new Set(['error', 'warning', 'info', 'success']);

function resolveKind(type: string): string
{
	const kind = type.toLowerCase();

	return KnownKinds.has(kind) ? kind : 'info';
}

function renderMessage(message: GridMessage): HTMLElement
{
	const item = Tag.render`
		<div class="mail-message-grid-messages__item --${resolveKind(message.TYPE)}"
			data-testid="${TestId.ScreenNoticeItem}"></div>
	`;

	if (message.TITLE)
	{
		Dom.append(
			Tag.render`<div class="mail-message-grid-messages__title">${Text.encode(message.TITLE)}</div>`,
			item,
		);
	}

	if (message.TEXT)
	{
		Dom.append(
			Tag.render`<div class="mail-message-grid-messages__text">${Text.encode(message.TEXT)}</div>`,
			item,
		);
	}

	return item;
}

/**
 * Words the screen handed over with the page. They belong to the moment the screen opened and to
 * nothing after it, so they are shown once and the grid keeps no state about them. The text is
 * written by whoever sent the request, so it is encoded before it reaches the markup.
 */
export function showScreenMessages(messages: GridMessage[]): void
{
	if (messages.length === 0)
	{
		return;
	}

	const content = Tag.render`
		<div class="mail-message-grid-messages" data-testid="${TestId.ScreenNotice}"></div>
	`;
	messages.forEach((message: GridMessage): void => {
		Dom.append(renderMessage(message), content);
	});

	new Popup({
		id: PopupId,
		content,
		autoHide: true,
		closeByEsc: true,
		closeIcon: true,
		overlay: { opacity: 30 },
		minWidth: 400,
		maxWidth: 800,
		cacheable: false,
		className: 'mail-message-grid-messages-popup',
	}).show();
}
