import { VisuallyHidden } from 'ui.a11y';

export function visuallyHidden(text: string): HTMLElement
{
	const node = new VisuallyHidden();
	node.textContent = text;

	return node;
}
