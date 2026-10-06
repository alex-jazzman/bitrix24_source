import { Icon, Outline, Actions, Main } from 'ui.icon-set.api.core';

const NAME_MAP: { [string]: string } = {
	chevron: Actions.CHEVRON_RIGHT,
	search: Main.SEARCH_1,
	dots: Outline.MORE_M,
	plus: Actions.PLUS_30,
	close: Outline.CROSS_L,
	market: Outline.MARKET,
	apps: Outline.APPS,
};

export function getIconName(name: string): string
{
	return NAME_MAP[name] ?? name;
}

export function renderIcon(name: string, size: number | null = null): HTMLElement
{
	const iconName = getIconName(name);
	const params = { icon: iconName };
	if (size !== null)
	{
		params.size = size;
	}

	return new Icon(params).render();
}
