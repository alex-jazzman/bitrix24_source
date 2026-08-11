import { useLoc } from '../../../../shared/composables';

import './inspector-grid-view.css';

type Row = {
	name: string;
	type: string;
};

// @vue/component
export const InspectorGridView = {
	name: 'InspectorGridView',
	props:
	{
		countRowsOnPage:
		{
			type: Number,
			required: true,
		},
		currentPageNumber:
		{
			type: Number,
			required: true,
		},
		/** @type SelectedGridViewGroup */
		selectedGridViewGroup:
		{
			type: [null, Object],
			required: true,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		heads(): Map<string, string>
		{
			const headData = [
				['name', this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_NAME_COLUMN')],
				['type', this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_TYPE_COLUMN')],
			];

			return new Map(headData);
		},
		rows(): Map<string, Row>
		{
			if (!this.selectedGridViewGroup)
			{
				return new Map();
			}

			const { values } = this.selectedGridViewGroup;

			return new Map(values.map(({ text, dataType }, i) => {
				return [
					`rowId_${i}`,
					{
						id: `rowId_${i}`,
						name: text,
						type: dataType,
					},
				];
			}));
		},
		renderedRowsIds(): Array<string>
		{
			const rowsIds = [...this.rows.keys()];
			const startIdx = (this.currentPageNumber - 1) * this.countRowsOnPage;

			return rowsIds.slice(startIdx, startIdx + this.countRowsOnPage);
		},
	},
	methods:
	{
		getRowCellClass(headId: string): string
		{
			if (headId === 'name')
			{
				return '--name';
			}

			if (headId === 'type')
			{
				return '--type';
			}

			return '';
		},
	},
	template: `
		<div class="editor-chart-inspector-grid-view">
			<div class="editor-chart-inspector-grid-view__table">
				<div class="editor-chart-inspector-grid-view__heads">
					<span
						v-for="[id, label] in heads"
						:key="id"
						class="editor-chart-inspector-grid-view__cell"
					>
						{{ label }}
					</span>
				</div>
				<div class="editor-chart-inspector-grid-view__rows">
					<div
						v-for="rowId in renderedRowsIds"
						class="editor-chart-inspector-grid-view__row"
					>
						<span
							v-for="[headId] in heads"
							class="editor-chart-inspector-grid-view__cell"
							:key="rowId + '-' + headId"
							:class="getRowCellClass(headId)"
						>
							{{ rows.get(rowId)[headId] }}
						</span>
					</div>
				</div>
			</div>
			<slot
				name="navigate-grid-view"
				:totalRowsCount="rows.size"
			/>
		</div>
	`,
};
