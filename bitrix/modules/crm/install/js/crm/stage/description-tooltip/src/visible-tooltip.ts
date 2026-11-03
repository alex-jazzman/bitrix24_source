export function isSameVisibleTooltip(
	currentBindElement: HTMLElement | null,
	popupContainer: HTMLElement | null,
	nextBindElement: HTMLElement,
): boolean
{
	return popupContainer !== null && currentBindElement === nextBindElement;
}
