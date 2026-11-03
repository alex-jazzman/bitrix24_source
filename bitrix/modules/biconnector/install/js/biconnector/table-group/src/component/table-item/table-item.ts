import { BIcon, Outline } from 'ui.icon-set.api.vue';
import type { BitrixVueComponentProps } from 'ui.vue3';
import { getTableIconPath, getTableLabel } from '../../const/table-view';
// eslint-disable-next-line no-unused-vars
import { type Table } from '../../const/type';

import './table-item.css';

export const TableItem: BitrixVueComponentProps = {
	name: 'BIConnectorTableGroupTableItem',
	components: {
		BIcon,
	},
	props: {
		table: {
			/** @type Table */
			type: Object,
			required: true,
		},
	},
	emits: [
		'onTableRemove',
	],
	computed: {
		iconSet(): typeof Outline
		{
			return Outline;
		},
		iconPath(): string
		{
			return getTableIconPath(this.table.type);
		},
		label(): string
		{
			return getTableLabel(this.table);
		},
	},
	methods: {
		handleRemoveClick(): void
		{
			this.$emit('onTableRemove', { code: this.table.code });
		},
	},
	// language=Vue
	template: `
		<div class="biconnector-table-group-item">
			<img
				class="biconnector-table-group-item__icon"
				:src="iconPath"
				width="32"
				height="32"
				alt=""
			>
			<div class="biconnector-table-group-item__name" :title="label">{{ label }}</div>
			<BIcon
				:name="iconSet.CROSS_L"
				:size="20"
				color="var(--ui-color-base-4)"
				class="biconnector-table-group-item__remove"
				@click="handleRemoveClick"
			/>
		</div>
	`,
};
