import { Loc, Tag } from 'main.core';

export class CatalogPopupCompanyListEmptyState
{
	render(): HTMLElement
	{
		return Tag.render`
			<div class="vibecode-catalog__content-empty-state">
				<div class="vibecode-catalog__popup-empty-state vibecode-catalog__popup-empty-state--content">
					<div class="vibecode-catalog__popup-empty-state-text">
						<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
							${Loc.getMessage('VIBECODECONNECTOR_CATALOG_COMPANY_EMPTY_TITLE')}
						</p>
					</div>
				</div>
			</div>
		`;
	}
}
