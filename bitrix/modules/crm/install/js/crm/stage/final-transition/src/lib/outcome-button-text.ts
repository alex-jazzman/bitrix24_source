export function isOutcomeButtonTextCropped(textNode: HTMLElement | null): boolean
{
	return textNode !== null && textNode.offsetWidth < textNode.scrollWidth;
}
