import { Tag, Dom } from 'main.core';

export class ProgressBar
{
	currentStep: number;
	totalStep: number;

	constructor(options)
	{
		this.currentStep = options.currentStep;
		this.totalStep = options.totalStep;
	}

	render(): HTMLElement
	{
		const progressBar = Tag.render`
			<div class="intranet-year-results-popup__progress-bar"></div>
		`;

		for (let i = 0; i <= this.currentStep; i++)
		{
			Dom.append(
				Tag.render`<div class="intranet-year-results-popup__progress-bar-step intranet-year-results-popup__progress-bar-step--active"></div>`,
				progressBar,
			);
		}

		for (let i = this.currentStep + 1; i < this.totalStep; i++)
		{
			Dom.append(
				Tag.render`<div class="intranet-year-results-popup__progress-bar-step"></div>`,
				progressBar,
			);
		}

		return progressBar;
	}
}
