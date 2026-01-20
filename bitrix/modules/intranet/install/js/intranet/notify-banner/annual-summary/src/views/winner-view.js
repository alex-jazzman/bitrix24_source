import { Tag } from 'main.core';
import FeatureType from '../feature-type';
import { WithButtonView } from './with-button-view';

export type WinnerMessageOptions = {
	title: string,
	name: string,
	description: string,
}

export class WinnerView extends WithButtonView
{
	#message: WinnerMessageOptions;
	#featureClass: ?string;
	feature: FeatureType;

	constructor(options: {})
	{
		super(options);
		this.#message = options.message;
		this.#featureClass = options.featureClass ?? '';
		this.progressBar = options.progressBar;
		this.feature = options.feature;
	}

	content(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-year-results-popup__slide ${this.#featureClass} intranet-year-results-popup__slide--character">
				<div class="intranet-year-results-popup__slide-image"></div>
				<div class="intranet-year-results-popup__slide-content">
					${this.progressBar?.render()}
					<div class="intranet-year-results-popup__logo"></div>
					<h3 class="intranet-year-results-popup__subtitle">${this.#message.title}</h3>
					<h2 class="intranet-year-results-popup__title intranet-year-results-popup__title--bold">${this.#message.name}</h2>
					<p class="intranet-year-results-popup__description--character">${this.#message.description}</p>
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
