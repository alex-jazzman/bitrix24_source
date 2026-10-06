import { Loc, Tag } from 'main.core';

export function renderColoredMessage(
	messageCode: string,
	coloredClassName: string = 'vibecode-catalog__title--colored',
): HTMLElement
{
	const message = Loc.getMessage(messageCode, {
		'[colored]': `<span class="${coloredClassName}">`,
		'[/colored]': '</span>',
	}) ?? '';
	const node = Tag.render`<span></span>`;

	node.innerHTML = message;

	return node;
}
