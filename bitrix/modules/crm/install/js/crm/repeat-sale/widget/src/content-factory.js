import { Runtime } from 'main.core';
import { Base } from './content/base';
import { ForceStart } from './content/force-start';
import { Start } from './content/start';
import type { WidgetParams, WidgetTypeEnum } from './types';
import { WidgetType } from './types';

// The statistics content and its styles are heavier than the rest of the widget put together, while the
// button that shows the widget is on every CRM page. Its extension is asked for on the first opening of
// the statistics; main.core keeps the loaded extension, so reopening costs nothing.
const StatisticsExtension = 'crm.repeat-sale.widget.statistics';

export class ContentFactory
{
	static async getContentInstance(widgetType: WidgetTypeEnum, params: WidgetParams = {}): Promise<?Base>
	{
		switch (widgetType)
		{
			case WidgetType.start:
				return new Start(params);
			case WidgetType.forceStart:
				return new ForceStart(params);
			case WidgetType.statistics:
			{
				const { Statistics } = await Runtime.loadExtension(StatisticsExtension);

				return new Statistics(params);
			}
			default:
				return null;
		}
	}
}
