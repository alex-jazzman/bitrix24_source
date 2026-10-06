import { Dom, Type } from 'main.core';

/**
 * Integration names come from a marketplace app through the humanresources REST intake,
 * so they are untrusted input and must never reach the row as markup.
 */
export function setIntegrationText(node: HTMLElement | null, value: ?string): void
{
	if (!Type.isDomNode(node))
	{
		return;
	}

	Dom.adjust(node, { text: value ?? '' });
}
