import {Dom, Text} from 'main.core';
import {Loc} from 'landing.loc';

export default function decorateTreeSemantics(root: HTMLElement)
{
	Dom.attr(root, {
		role: 'tree',
		'aria-label': Loc.getMessage('LANDING_MENU_TREE_LABEL'),
	});

	decorateGroup(root, 1);
}

function decorateGroup(container, level)
{
	const items = [...container.children].filter((li) => {
		return li.tagName === 'LI' && li.querySelector(':scope > a');
	});

	[...container.children].forEach((li) => {
		if (li.tagName !== 'LI')
		{
			return;
		}

		Dom.attr(li, 'role', 'none');

		const link = li.querySelector(':scope > a');
		const childList = li.querySelector(':scope > ul');
		const hasChildItems = childList && [...childList.children].some((node) => {
			return node.tagName === 'LI' && node.querySelector(':scope > a');
		});

		if (link)
		{
			Dom.attr(link, {
				role: 'treeitem',
				'aria-level': String(level),
				'aria-setsize': String(items.length),
				'aria-posinset': String(items.indexOf(li) + 1),
			});

			if (hasChildItems)
			{
				if (!childList.id)
				{
					childList.id = Text.getRandom();
				}

				Dom.attr(link, {
					'aria-expanded': 'true',
					'aria-owns': childList.id,
				});
			}
			else
			{
				link.removeAttribute('aria-expanded');
			}
		}

		if (hasChildItems)
		{
			Dom.attr(childList, 'role', 'group');
			decorateGroup(childList, level + 1);
		}
	});
}
