import { Event, Loc, Tag } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';

import { sendCatalogAnalytics } from '../utils/analytics';
import { openVibecodeDashboard } from '../utils/links';
import { getCatalogBrand } from '../utils/settings';

export class CatalogPopupMyListEmptyState
{
	render(): HTMLElement
	{
		const emptyTitleMessageId = getCatalogBrand() === 'alaio'
			? 'VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_TITLE_ALAIO'
			: 'VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_TITLE_BITRIX24';

		return Tag.render`
			<div class="vibecode-catalog__content-empty-state">
				<div class="vibecode-catalog__popup-empty-state vibecode-catalog__popup-empty-state--content">
					<div class="vibecode-catalog__popup-empty-state-text">
						<h4 class="vibecode-catalog__popup-empty-state-title ui-headline --sm">
							${Loc.getMessage(emptyTitleMessageId)}
						</h4>
						<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
							${Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_DESCRIPTION')}
						</p>
					</div>
					${this.#renderActionButton()}
				</div>
			</div>
		`;
	}

	#renderActionButton(): HTMLElement
	{
		const actionButton = new Button({
			className: 'vibecode-catalog__popup-empty-state-button',
			size: ButtonSize.MEDIUM,
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_BUTTON'),
			props: {
				type: 'button',
			},
		}).render();

		Event.bind(actionButton, 'click', (event: MouseEvent) => {
			event.preventDefault();
			sendCatalogAnalytics({ event: 'click_vibecode', c_section: 'content_empty_state' });
			openVibecodeDashboard();
		});

		return actionButton;
	}
}
