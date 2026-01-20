import { Tag } from 'main.core';
import { WithButtonView } from './with-button-view';
import { Message } from '../message';
import FeatureType from '../feature-type';

export class SummaryView extends WithButtonView
{
	message: Message;
	feature: FeatureType;

	constructor(options)
	{
		super(options);
		this.message = options.message;
		this.feature = options.feature;
		this.progressBar = options.progressBar;
	}

	content(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-year-results-popup__slide intranet-year-results-popup__slide--${this.feature}">
				<div class="intranet-year-results-popup__slide-image"></div>
				<div class="intranet-year-results-popup__slide-content">
					${this.progressBar?.render()}
					<div class="intranet-year-results-popup__logo"></div>
					<h2 class="intranet-year-results-popup__title">${this.message?.title}</h2>
					<div class="intranet-year-results-popup__description-container">
						<p class="intranet-year-results-popup__description">${this.message?.description}</p>
					</div>
				</div>
				<div class="intranet-year-results-popup__slide-footer">
					${this.downloadButton()}
					${this.shareButton()}
				</div>
			</div>
		`;
	}

	featureType(): ?string
	{
		return this.feature;
	}

	index(): ?number
	{
		return (this.progressBar?.currentStep ?? 0) + 1;
	}
}
