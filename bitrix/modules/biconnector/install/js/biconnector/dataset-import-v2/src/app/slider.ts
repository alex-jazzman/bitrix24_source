import { SidePanel } from 'main.sidepanel';

type ConnectionParams = {
	connectionId?: number,
	connectionType?: string,
	tableName?: string,
	connectionIsSupportMapping?: boolean | string,
};

type SectionsConfig = Record<string, Record<string, boolean | string>>;

const COMPONENT_LINK = '/bitrix/components/bitrix/biconnector.dataset.import.v2/slider.php';

export class Slider
{
	static open(
		sourceId: string,
		datasetId: number = 0,
		connection: ConnectionParams = {},
		sectionsConfig: SectionsConfig = {},
	): void
	{
		const params: Record<string, string> = { sourceId };
		if (datasetId)
		{
			params.datasetId = String(datasetId);
		}

		const query: string[] = Object.entries(params).map(
			([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
		);

		if (connection && typeof connection === 'object' && Object.keys(connection).length > 0)
		{
			Object.entries(connection).forEach(([key, value]) => {
				query.push(`${encodeURIComponent(`connection[${key}]`)}=${encodeURIComponent(String(value))}`);
			});
		}

		if (sectionsConfig && typeof sectionsConfig === 'object' && Object.keys(sectionsConfig).length > 0)
		{
			Object.entries(sectionsConfig).forEach(([section, config]) => {
				Object.entries(config).forEach(([property, value]) => {
					const key = `sectionsConfig[${section}][${property}]`;
					query.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
				});
			});
		}

		const url = query.length > 0 ? `${COMPONENT_LINK}?${query.join('&')}` : COMPONENT_LINK;

		SidePanel.Instance.open(url, {
			allowChangeHistory: false,
			cacheable: false,
			customLeftBoundary: 0,
		});
	}
}
