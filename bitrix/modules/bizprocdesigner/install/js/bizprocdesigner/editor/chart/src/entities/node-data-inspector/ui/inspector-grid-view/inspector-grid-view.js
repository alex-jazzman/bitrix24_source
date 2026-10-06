import { useLoc } from '../../../../shared/composables';

import { type InspectorViewItem } from '../../types';
import { InspectorValueCell } from '../inspector-value-cell/inspector-value-cell';

import './inspector-grid-view.css';

/**
 * Name and type columns read the fields copied into the row, the value column reads the item.
 * A selected group can hold subgroups, so the item is not always a data item: a container has
 * neither a data type nor a value of its own.
 */
type Row = {
	id: string;
	name: string;
	type: ?string;
	item: InspectorViewItem;
};

// @vue/component
export const InspectorGridView = {
	name: 'InspectorGridView',
	components: {
		InspectorValueCell,
	},
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
				['value', this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_VALUE_COLUMN')],
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

			return new Map(values.map((item, i) => {
				return [
					`rowId_${i}`,
					{
						id: `rowId_${i}`,
						name: item.text,
						type: item.dataType,
						item,
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
		getCellClass(headId: string): string
		{
			return `--${headId}`;
		},
	},
	template: `
		<div class="editor-chart-inspector-grid-view">
			<div class="editor-chart-inspector-grid-view__table" role="table">
				<div class="editor-chart-inspector-grid-view__heads" role="row">
					<span
						v-for="[id, label] in heads"
						:key="id"
						class="editor-chart-inspector-grid-view__cell"
						:class="getCellClass(id)"
						role="columnheader"
						:data-test-id="$testId('nodeDataInspectorGridHead', id)"
					>
						{{ label }}
					</span>
				</div>
				<div class="editor-chart-inspector-grid-view__rows" role="rowgroup">
					<div
						v-for="(rowId, rowIndex) in renderedRowsIds"
						class="editor-chart-inspector-grid-view__row"
						role="row"
					>
						<span
							v-for="[headId] in heads"
							class="editor-chart-inspector-grid-view__cell"
							:key="rowId + '-' + headId"
							:class="getCellClass(headId)"
							role="cell"
							:data-test-id="$testId('nodeDataInspectorGridCell', headId, String(rowIndex))"
						>
							<InspectorValueCell
								v-if="headId === 'value'"
								:data-test-id="$testId('nodeDataInspectorGridValueText', String(rowIndex))"
								:item="rows.get(rowId).item"
							/>
							<template v-else>{{ rows.get(rowId)[headId] }}</template>
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
