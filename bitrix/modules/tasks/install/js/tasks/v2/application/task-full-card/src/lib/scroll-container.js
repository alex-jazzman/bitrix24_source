export function findScrollableAncestor(element: ?HTMLElement): ?HTMLElement
{
	let node = element?.parentElement;

	while (node && node !== document.body)
	{
		const { overflowY } = getComputedStyle(node);
		const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight;

		if (isScrollable)
		{
			return node;
		}

		node = node.parentElement;
	}

	return null;
}
