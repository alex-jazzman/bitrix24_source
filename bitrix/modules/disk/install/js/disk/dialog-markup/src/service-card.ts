import { Dom, Loc, Tag } from 'main.core';

export type ServiceCard = {
	service: string,
	id: string,
	testId: string,
	modifierClass: string,
	titleId: string,
	descriptionId: string,
	titleMessageId: string,
	descriptionMessageId: string,
	hidden?: boolean,
};

const CARD_CLASS = 'bx-disk-info-popup-btn';
// The group around the cards reads the state back by this attribute, so it is part of the contract.
export const SERVICE_CARD_HIDDEN_ATTRIBUTE = 'data-hidden';
const CARD_ACTIVE_CLASS = 'bx-disk-info-popup-btn-active';

export function renderServiceCard(card: ServiceCard, isSelected: boolean): HTMLElement
{
	const isHidden = card.hidden === true;
	const title = Loc.getMessage(card.titleMessageId) ?? '';
	const description = Loc.getMessage(card.descriptionMessageId) ?? '';

	// `tabindex` stays on the card and stays negative: it is what makes the card focusable for the
	// focus zone of the group, while the single entry point of the group is the zone's to hand out.
	const node: HTMLElement = Tag.render`
		<span
			id="${card.id}"
			class="${CARD_CLASS} ${card.modifierClass}"
			data-service="${card.service}"
			data-testid="${card.testId}"
			role="radio"
			tabindex="-1"
			aria-checked="${isSelected ? 'true' : 'false'}"
			aria-labelledby="${card.titleId}"
			aria-describedby="${card.descriptionId}"
		>
			<span class="bx-disk-info-popup-btn-text"><span id="${card.titleId}">${title}</span></span>
			<span class="bx-disk-info-popup-btn-descript" id="${card.descriptionId}">${description}</span>
			<span class="bx-disk-info-popup-btn-check"></span>
		</span>
	`;

	if (isSelected)
	{
		Dom.addClass(node, CARD_ACTIVE_CLASS);
		Dom.attr(node, 'data-autofocus', '');
	}

	if (isHidden)
	{
		Dom.attr(node, SERVICE_CARD_HIDDEN_ATTRIBUTE, '');
		Dom.style(node, 'display', 'none');
	}

	return node;
}
