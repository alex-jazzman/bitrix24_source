import { Tag } from 'main.core';

import './media.css';

const BLOCK_CLASS = 'ui-system-whats-new-bleed';

/**
 * The layer the graphics of the announcement flies out onto. It stands over the card and outside the cut of
 * the window: the graphics rises over the top edge and leaves the card at the sides, and the zone it came
 * from keeps the room it took, so nothing pulls the card up from under it.
 *
 * The layer is decoration whole. It takes no pointer - a click that landed past the window has to reach the
 * window mechanism and close it, and the flown graphics must never take a click meant for the cross - and it
 * is hidden from assistive technology: what the announcement says is said by the text of the card.
 */
export const renderBleed = (content: HTMLElement): HTMLElement => {
	return Tag.render`
		<div class="${BLOCK_CLASS}" aria-hidden="true" data-testid="announce-dialog-bleed">${content}</div>
	`;
};
