import './catalog-group-empty-label.css';
import { useLoc } from '../../../../shared/composables';
import type { GetMessage } from '../../../../shared/composables';

type CatalogGroupEmptyLabelSetup = {
	getMessage: GetMessage,
};

// @vue/component
export const CatalogGroupEmptyLabel = {
	name: 'catalog-group-empty-label',
	setup(): CatalogGroupEmptyLabelSetup
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	template: `
		<div class="editor-chart-catalog-group-empty-label">
			<h2>{{ getMessage('BIZPROCDESIGNER_EDITOR_EMPTY_GROUP_TITLE') }}</h2>
			<p>{{ getMessage('BIZPROCDESIGNER_EDITOR_EMPTY_GROUP_DESCRIPTION') }}</p>
		</div>
	`,
};
