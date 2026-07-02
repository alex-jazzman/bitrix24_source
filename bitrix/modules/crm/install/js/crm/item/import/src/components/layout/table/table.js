import { BitrixVueComponentProps } from 'ui.vue3';
import { Type } from 'main.core';

import { Value } from './value';
import './table.css';

export type Header = {
	columnIndex: number,
	title: string,
};

export type Row = {
	values: RowValue[],
	errors: string[],
};

export type RowValue = {
	columnIndex: number,
	value: any,
};

export const Table: BitrixVueComponentProps = {
	name: 'Table',

	props: {
		headers: {
			/** @type Header[] */
			type: Array,
			required: true,
		},
		rows: {
			/** @type Row[] */
			type: Array,
			required: true,
		},
	},

	components: {
		Value,
	},

	data(): Object
	{
		return {
			stickyScrollWidth: 0,
			isSyncingScroll: false,
		};
	},

	mounted(): void
	{
		this.updateStickyScrollWidth();
		this.resizeObserver = new ResizeObserver(() => this.updateStickyScrollWidth());
		this.resizeObserver.observe(this.$refs.tableContainer);
	},

	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
	},

	computed: {
		rowsByHeaders(): Row[]
		{
			return this.rows
				.map((row: Row): Row => {
					return {
						values: this.columnMap.map((column: number): RowValue => {
							const rowValueByColumn = row.values
								.find((rowValue) => rowValue.columnIndex === column);

							if (!rowValueByColumn)
							{
								return {
									value: '',
									columnIndex: column,
								};
							}

							return rowValueByColumn;
						}),
						errors: row.errors,
					};
				});
		},

		columnMap(): number[]
		{
			return this.headers.map((header: Header) => {
				return header.columnIndex;
			});
		},
	},

	methods: {
		formatErrors(errors: Array<string>): Array<string>
		{
			return errors.flatMap((error: string): string => {
				return this.splitErrorMessageByBr(error)
					.filter((errorMessage) => Type.isStringFilled(errorMessage))
				;
			});
		},

		splitErrorMessageByBr(errorMessage: string): Array
		{
			const error = errorMessage.replaceAll(/<br\/>|<br \/>|<br>/gi, '<br>');

			return error.split('<br>');
		},

		updateStickyScrollWidth(): void
		{
			const container = this.$refs.tableContainer;
			if (container)
			{
				this.stickyScrollWidth = container.scrollWidth;
			}
		},

		onStickyScroll(event: Event): void
		{
			if (this.isSyncingScroll)
			{
				return;
			}

			this.isSyncingScroll = true;
			this.$refs.tableContainer.scrollLeft = event.target.scrollLeft;
			this.isSyncingScroll = false;
		},

		onTableScroll(event: Event): void
		{
			if (this.isSyncingScroll)
			{
				return;
			}

			this.isSyncingScroll = true;
			this.$refs.stickyScroll.scrollLeft = event.target.scrollLeft;
			this.isSyncingScroll = false;
		},
	},

	template: `
		<div class="crm-item-import__table-wrapper">
		<div class="crm-item-import__table-container" ref="tableContainer" @scroll="onTableScroll">
			<table class="crm-item-import__table">
				<thead>
					<tr>
						<th
							v-for="header in headers">
							{{ header.title }}
						</th>
					</tr>
				</thead>
				<tbody>
					<template v-for="row in rowsByHeaders">
						<tr
							v-if="row.errors"
							v-for="error in formatErrors(row.errors)"
						>
							<td :colspan="headers.length">
								<span class="crm-item-import__error">{{ error }}</span>
							</td>
						</tr>
						<tr>
							<td v-for="rowValue in row.values">
								<Value :value="rowValue.value" />
							</td>
						</tr>
					</template>
				</tbody>
			</table>
		</div>
		<div class="crm-item-import__table-sticky-scroll" ref="stickyScroll" @scroll="onStickyScroll">
			<div :style="{ width: stickyScrollWidth + 'px', height: '1px' }"></div>
		</div>
		</div>
	`,
};
