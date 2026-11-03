export function isPopupContainerMouseLeave(
	target: EventTarget | null,
	popupContainer: HTMLElement | null,
): boolean
{
	return popupContainer !== null && target === popupContainer;
}
