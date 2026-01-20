import { Tag, Type } from 'main.core';
import './css/view.css';
import { EventEmitter } from 'main.core.events';
import { StepperController } from './stepper-controller';

export class BaseView extends EventEmitter
{
	#id: string;
	#excludeFromSteps: boolean = false;
	#stepper: StepperController;

	constructor(options = {})
	{
		super();
		this.setEventNamespace('BX.Intranet.PushOtp.ConnectPopup.View');
		this.#id = Type.isStringFilled(options.id) ? options.id : '';
		this.#excludeFromSteps = options.excludeFromSteps === true;
		this.#stepper = new StepperController({
			enabled: !this.#excludeFromSteps,
		});
	}

	getId(): string
	{
		return this.#id;
	}

	isExcludedFromSteps(): boolean
	{
		return this.#excludeFromSteps;
	}

	setStepInfo(currentStep: number, totalSteps: number): void
	{
		this.#stepper.setStepInfo(currentStep, totalSteps);
	}

	getStepInfo(): Object
	{
		return this.#stepper.getStepInfo();
	}

	renderStepIndicators(): HTMLElement
	{
		return this.#stepper.render();
	}

	render(): HTMLElement
	{
		return Tag.render``;
	}

	beforeDismiss(option: Object): void
	{}

	afterShow(option: Object): void
	{}

	afterDismiss(option: Object): void
	{}

	beforeShow(option: Object): void
	{}
}
