import { Loc, Tag } from 'main.core';

export class CatalogNoAccessState
{
	render(): HTMLElement
	{
		return Tag.render`
			<div class="vibecode-catalog__empty-popup --no-action --ui-context-edge-dark" data-testid="vibecode-catalog-no-access">
				<div class="vibecode-catalog__popup-empty-state">
					<div class="vibecode-catalog__popup-empty-state-text">
						<h4 class="vibecode-catalog__popup-empty-state-title ui-headline --sm">
							${Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_NO_ACCESS_TITLE')}
						</h4>
						<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
							${Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_NO_ACCESS_DESCRIPTION')}
						</p>
					</div>
				</div>
			</div>
		`;
	}
}
