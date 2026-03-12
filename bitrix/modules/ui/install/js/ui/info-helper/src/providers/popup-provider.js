import { Type } from 'main.core';
import { PopupWithHeader, SaleTemplate } from 'ui.popup-with-header';
import { ProviderRequestFactory } from '../provider-request-factory';
import type { PopupProviderConfiguration } from '../types/configurations';
import { ProvidersType } from '../types/providers-type';
import { Analytics } from '../analytics';
import { BaseProvider } from './base-provider';

export class PopupProvider extends BaseProvider
{
	#dataSource: Promise;
	#bindElement: HTMLElement;
	#popup: PopupWithHeader;
	#code: string;
	#analytics: Analytics;

	constructor(config: PopupProviderConfiguration)
	{
		super();

		if (Type.isDomNode(config.bindElement))
		{
			this.#bindElement = config.bindElement;
		}
		else
		{
			throw new Error("Invalid parameter 'bindElement'");
		}

		if (Type.isString(config.code))
		{
			this.#code = config.code;
		}
		else
		{
			throw new Error("Invalid parameter 'code'");
		}

		if (config.dataSource && config.dataSource instanceof Promise)
		{
			this.#dataSource = config.dataSource;
		}
		else
		{
			const providerRequestFactoryConfiguration = {
				type: ProvidersType.POPUP,
				code: this.#code,
				featureId: config.featureId,
			};
			this.#dataSource = (new ProviderRequestFactory(providerRequestFactoryConfiguration)).getRequest();
		}

		this.#analytics = new Analytics(
			config.analytics?.type ?? this.#code,
			ProvidersType.POPUP,
		);
	}

	show(code, params): void
	{
		this.#getPopup().show();
		this.#analytics.sendByEventName('show');
	}

	close()
	{
		this.#getPopup().close();
		this.#analytics.sendByEventName('close');
	}

	#getPopup(): PopupWithHeader
	{
		if (!this.#popup)
		{
			const analyticsCallbackFunction = (event, additionalParameter) => {
				if (this.#analytics)
				{
					this.#analytics.sendByEventName(event, additionalParameter);
				}
			};

			this.#popup = new PopupWithHeader({
				target: this.#bindElement,
				id: `demo-popup-components-maker-${Math.random(8)}`,
				width: 370,
				skeletonWidth: 370,
				content: [],
				asyncData: this.#dataSource,
				template: new SaleTemplate(
					{
						analyticsCallback: analyticsCallbackFunction,
					},
				),
				analyticsCallback: analyticsCallbackFunction,
			});
		}

		return this.#popup;
	}
}
