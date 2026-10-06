import { Dom, Type } from 'main.core';
import { Chip, ChipSize, ChipDesign } from 'ui.system.chip';

import { renderTabCounter } from '../utils/counter.js';
import { getIconName } from '../utils/icons.js';
import { type TabConfig } from '../catalog';

export function createPopupTabChip(
	tab: TabConfig,
	onClick: () => void,
): { chip: Chip, node: HTMLElement }
{
	const chip = new Chip({
		size: ChipSize.Md,
		design: ChipDesign.Outline,
		rounded: true,
		compact: true,
		text: tab.title,
		icon: Type.isStringFilled(tab.icon) ? getIconName(tab.icon) : null,
		onClick,
	});
	const node = chip.render();

	Dom.addClass(node, 'vibecode-catalog__tab');
	node.dataset.tabId = tab.id;

	if (Type.isStringFilled(tab.navigateUrl))
	{
		node.setAttribute('role', 'link');
	}
	else
	{
		node.setAttribute('role', 'tab');
		node.setAttribute('aria-selected', 'false');
	}

	node.setAttribute('data-testid', `vibecode-catalog-tab-${tab.id}`);

	if (Type.isNumber(tab.counter) && tab.counter > 0)
	{
		Dom.append(renderTabCounter(tab.counter), node);
	}

	return {
		chip,
		node,
	};
}
