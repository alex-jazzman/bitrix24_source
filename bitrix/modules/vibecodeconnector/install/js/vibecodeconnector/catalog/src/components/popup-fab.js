import { Event, Loc } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';

import { sendCatalogAnalytics } from '../utils/analytics';
import { getIconName } from '../utils/icons.js';
import { openVibecodeDashboard } from '../utils/links';

export function renderPopupFab(): HTMLElement
{
	const fab = new Button({
		className: 'vibecode-catalog__fab',
		size: ButtonSize.EXTRA_LARGE,
		useAirDesign: true,
		style: AirButtonStyle.TINTED,
		icon: getIconName('plus'),
		props: {
			type: 'button',
			'aria-label': Loc.getMessage('VIBECODECONNECTOR_CATALOG_ADD_APP_LABEL'),
		},
	}).render();

	Event.bind(fab, 'click', (event: MouseEvent) => {
		event.preventDefault();
		sendCatalogAnalytics({ event: 'click_vibecode', c_section: 'fab' });
		openVibecodeDashboard();
	});

	return fab;
}
