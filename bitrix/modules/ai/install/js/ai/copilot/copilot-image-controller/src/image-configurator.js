import { Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';

import './css/image-configurator.css';

import { ImageConfiguratorStyles } from './image-configurator-styles';
import { ImageConfiguratorParams } from './image-configurator-params';
import type { ImageConfiguratorParamsCurrentValues } from './image-configurator-params-config';

type ImageConfiguratorOptions = {}

export type getParamsResult = {
	style: string;
} | ImageConfiguratorParamsCurrentValues;

export class ImageConfigurator extends EventEmitter
{
	#container: HTMLElement;
	#imageConfiguratorStyles: ImageConfiguratorStyles;
	#imageConfiguratorParams: ImageConfiguratorParams;

	constructor(options: ImageConfiguratorOptions)
	{
		super(options);

		this.setEventNamespace('AI.Copilot.ImageConfigurator');
	}

	getParams(): getParamsResult
	{
		return {
			style: this.#imageConfiguratorStyles.getSelectedStyle(),
			...this.#imageConfiguratorParams.getCurrentValues(),
		};
	}

	isContainsTarget(target: HTMLElement): boolean
	{
		return this.#container?.contains(target) || this.#imageConfiguratorParams?.isContainsTarget(target);
	}

	render(): HTMLElement
	{
		this.#container = Tag.render`
			<div class="ai__copilot-image-configurator">
				<div class="ai__copilot-image-configurator_styles">
					${this.#renderImageStyles()}
				</div>
				<div class="ai__copilot-image-configurator_params">
					${this.#renderImageParams()}
				</div>
			</div>
		`;

		return this.#container;
	}

	#renderImageStyles(): HTMLElement
	{
		this.#imageConfiguratorStyles = new ImageConfiguratorStyles({});

		return this.#imageConfiguratorStyles.render();
	}

	#renderImageParams(): HTMLElement
	{
		this.#imageConfiguratorParams = new ImageConfiguratorParams({});

		return this.#imageConfiguratorParams.render();
	}
}
