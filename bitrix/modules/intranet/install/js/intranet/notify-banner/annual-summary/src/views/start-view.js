import { Tag, Loc } from 'main.core';
import { WithButtonView } from './with-button-view';

export class StartView extends WithButtonView
{
	content(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-year-results-popup__slide intranet-year-results-popup__slide--start">
				<div class="intranet-year-results-popup__slide-image"></div>
				<div class="intranet-year-results-popup__slide-content">
					<div class="intranet-year-results-popup__logo"></div>
					<h2 class="intranet-year-results-popup__title intranet-year-results-popup__title--bold">${Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_TITLE')}</h2>
					<div class="intranet-year-results-popup__description-container">
						<p class="intranet-year-results-popup__description">${Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_DESCRIPTION')}</p>
						<p class="intranet-year-results-popup__description">${Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_DESCRIPTION_2')}</p>
					</div>
					<p class="intranet-year-results-popup__postscript">${Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_EPILOGUE')}</p>
				</div>
				${this.shareButton()}
			</div>
		`;
	}

	featureType(): ?string
	{
		return 'intro';
	}

	index(): ?number
	{
		return 0;
	}
}
