import { Uri } from 'main.core';
import { SidePanel } from 'ui.sidepanel';

export class Slider
{
	static open(sourceId: string, datasetId: ?number = 0): void
	{
		const componentLink = '/bitrix/components/bitrix/biconnector.dataset.import/slider.php';

		const sliderLink = new Uri(componentLink);
		sliderLink.setQueryParam('sourceId', sourceId);
		if (datasetId)
		{
			sliderLink.setQueryParam('datasetId', datasetId);
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
}
