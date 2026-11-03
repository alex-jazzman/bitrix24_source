type TagSelectorLike = {
	getDialog?: () => { destroy?: () => void };
	unsubscribeAll?: () => void;
};

export function destroyTagSelectors(selectors: Array<TagSelectorLike | null>): void
{
	selectors.forEach((selector) => {
		selector?.getDialog?.()?.destroy?.();
		selector?.unsubscribeAll?.();
	});
}
