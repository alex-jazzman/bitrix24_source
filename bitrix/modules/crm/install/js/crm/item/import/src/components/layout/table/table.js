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
	},

	template: `
		<div class="crm-item-import__table-container">
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
	`,
};
