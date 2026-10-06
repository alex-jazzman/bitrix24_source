import { FileSettingsCard } from '../cards/file-settings-card';
import { PropertiesCard } from '../cards/properties-card';
import { ColumnsCard } from '../cards/columns-card';
import { RelatedDatasetsCard } from '../cards/related-datasets-card';

export const CardsColumn = {
	components: {
		FileSettingsCard,
		PropertiesCard,
		ColumnsCard,
		RelatedDatasetsCard,
	},
	inject: ['sourceId'],
	computed:
	{
		isCsv()
		{
			return this.sourceId === 'csv';
		},
	},
	// language=Vue
	template: `
		<aside class="biconnector-dataset-import-v2__cards-column">
			<FileSettingsCard v-if="isCsv" />
			<PropertiesCard />
			<RelatedDatasetsCard />
			<ColumnsCard />
		</aside>
	`,
};
