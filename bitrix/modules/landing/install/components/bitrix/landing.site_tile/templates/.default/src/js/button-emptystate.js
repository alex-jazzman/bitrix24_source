import { Loc } from 'main.core';
import { Button } from 'ui.buttons';
export function createEmptystateButton(linkTo: string)
{
	const emptystateButton = new Button({
		text: Loc.getMessage('LANDING_SITE_TILE_SEARCH_EMPTY_BUTTON'),
		className: 'landing-sites__search-empty-button',
		useAirDesign: true,
		tag: Button.Tag.LINK,
		link: linkTo,
		style: Button.AirStyle.FILLED_BITRIX_GPT,
	});

	return emptystateButton.getContainer();
}
