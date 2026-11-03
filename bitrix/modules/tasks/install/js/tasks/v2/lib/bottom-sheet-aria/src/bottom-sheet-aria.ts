type SheetPopup = {
	getPopupContainer?: () => HTMLElement | null,
	getFocusTrap?: () => Object | null,
};

type BottomSheetComponent = {
	$refs?: {
		popup?: {
			getPopupInstance?: () => SheetPopup | null,
		},
	},
};

export function syncBottomSheetModality(bottomSheet: BottomSheetComponent | null | void): void
{
	const popup = bottomSheet?.$refs?.popup?.getPopupInstance?.();
	if (!popup)
	{
		return;
	}

	const container = popup.getPopupContainer?.();
	if (!container)
	{
		return;
	}

	// Without a focus trap Tab leaves the sheet, so claiming modality would hide reachable content.
	if (popup.getFocusTrap?.())
	{
		container.setAttribute('aria-modal', 'true');
	}
	else
	{
		container.removeAttribute('aria-modal');
	}
}
