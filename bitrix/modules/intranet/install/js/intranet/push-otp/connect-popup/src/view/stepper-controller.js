import { Tag, Type } from 'main.core';

export class StepperController
{
	#totalSteps: number = 4;
	#currentStep: number = 1;
	#enabled: boolean = true;

	constructor(options: Object = {})
	{
		if (Type.isNumber(options.totalSteps))
		{
			this.#totalSteps = Math.max(1, options.totalSteps);
		}

		if (Type.isNumber(options.currentStep))
		{
			this.#currentStep = this.#getBoundedStep(options.currentStep);
		}

		if (options.enabled === false)
		{
			this.#enabled = false;
		}
	}

	setEnabled(enabled: boolean): void
	{
		this.#enabled = enabled !== false;
	}

	setStepInfo(currentStep: number, totalSteps: number): void
	{
		if (Type.isNumber(totalSteps))
		{
			this.#totalSteps = Math.max(1, totalSteps);
		}

		if (Type.isNumber(currentStep))
		{
			this.#currentStep = this.#getBoundedStep(currentStep);
		}
	}

	getStepInfo(): Object
	{
		return {
			current: this.#currentStep,
			total: this.#totalSteps,
		};
	}

	render(): HTMLElement
	{
		if (!this.#enabled)
		{
			return Tag.render`<div></div>`;
		}

		const indicators = [];
		for (let i = 1; i <= this.#totalSteps; i++)
		{
			const isActive = i <= this.#currentStep ? '--active' : '';
			indicators.push(Tag.render`<div class="intranet-push-otp-connect-popup__popup-step-item ${isActive}"></div>`);
		}

		return Tag.render`<div class="intranet-push-otp-connect-popup__popup-step">${indicators}</div>`;
	}

	#getBoundedStep(step: number): number
	{
		const normalizedStep = Math.max(1, step);

		return Math.min(normalizedStep, this.#totalSteps);
	}
}
