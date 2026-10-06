import {Type} from 'main.core';

export default function createTreeFocusNavigator()
{
	return function getNextFocusable(direction, from, event)
	{
		if (!Type.isDomNode(from))
		{
			return null;
		}

		const li = from.closest('li');
		if (!li)
		{
			return null;
		}

		if (event.key === 'ArrowRight')
		{
			const group = li.querySelector(':scope > ul[role="group"]');

			return group ? group.querySelector(':scope > li > a[role="treeitem"]') : null;
		}

		if (event.key === 'ArrowLeft')
		{
			const parentGroup = li.parentElement;
			const parentLi = parentGroup ? parentGroup.closest('li') : null;

			return parentLi ? parentLi.querySelector(':scope > a[role="treeitem"]') : null;
		}

		return null;
	};
}
