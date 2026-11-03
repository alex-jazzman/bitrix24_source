import { BaseEvent, EventEmitter } from 'main.core.events';

import { type MessageRowHref } from '../../model/grid/types';

/**
 * Announced before the panel opens, and the screen answers it by counting the message as read: the
 * counter of the folder goes down and the row loses its unread mark without a request. The identifier
 * travels as text, the way the listeners of the screen have always received it.
 */
const OpenEvent = 'mail:openMessageForView';

type SidePanelApi = {
	Instance?: {
		open(url: string, options: Record<string, unknown>): void,
	},
};

/**
 * The list may itself be shown inside a panel, and a message belongs above it rather than beside it, so
 * the panel of the top window is the one asked to open.
 */
function getTopSidePanel(): SidePanelApi | null
{
	const topBx = (window.top as unknown as { BX?: { SidePanel?: SidePanelApi } } | null)?.BX;

	return topBx?.SidePanel ?? null;
}

export function openMessage(messageId: number, href: MessageRowHref): void
{
	EventEmitter.emit(OpenEvent, new BaseEvent({ compatData: [{ id: String(messageId) }] }));
	getTopSidePanel()?.Instance?.open(href.url, href.sliderData);
}
