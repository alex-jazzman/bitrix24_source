import { Uri, Type } from 'main.core';
import { SidePanel } from 'ui.sidepanel';

export class Slider
{
	static open(
		sourceId: string,
		datasetId: ?number = 0,
		connection: ?Object = {},
		sectionsConfig: ?Object = {},
	): void
	{
		const componentLink = '/bitrix/components/bitrix/biconnector.dataset.import/slider.php';
		const sliderLink = new Uri(componentLink);
		sliderLink.setQueryParam('sourceId', sourceId);

		if (datasetId)
		{
			sliderLink.setQueryParam('datasetId', datasetId);
		}

		if (Object.keys(connection).length > 0)
		{
			sliderLink.setQueryParam('connection', connection);
		}

		if (Type.isObject(sectionsConfig) && Object.keys(sectionsConfig).length > 0)
		{
			const sectionsConfigParams = Slider.serializeNestedObject(sectionsConfig, 'sectionsConfig');
			sliderLink.setQueryParams(sectionsConfigParams);
		}

		const options = {
			allowChangeHistory: false,
			cacheable: false,
			customLeftBoundary: 0,
		};

		SidePanel.Instance.open(
			sliderLink.toString(),
			options,
		);
	}

	static serializeNestedObject(obj, prefix = ''): {}
	{
		const params = {};

		Object.entries(obj).forEach(([key, value]) => {
			const paramKey = prefix ? `${prefix}[${key}]` : key;

			if (Type.isObject(value) && value !== null && !Array.isArray(value))
			{
				Object.assign(params, Slider.serializeNestedObject(value, paramKey));
			}
			else
			{
				params[paramKey] = String(value);
			}
		});

		return params;
	}
}
