import { Type } from 'main.core';
import { PreviewLoader } from './preview-loader';

// @vue/component
export const PreviewGrid = {
	name: 'BizprocDataViewPreviewGrid',
	components: {
		PreviewLoader,
	},
	props: {
		/** @type Array<{ code: string, title: string }> */
		columns: {
			type: Array,
			default: (): Array<Object> => [],
		},
		/** @type Array<{ [code: string]: any }> */
		rows: {
			type: Array,
			default: (): Array<Object> => [],
		},
		page: {
			type: Number,
			default: 1,
		},
		pageSize: {
			type: Number,
			default: 20,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
		errorMessage: {
			type: String,
			default: '',
		},
		/** Whether the form already yields a complete, previewable definition. */
		isReady: {
			type: Boolean,
			default: false,
		},
		/**
		 * What the table still needs before it can preview, phrased for the current operation. Shown
		 * once columns exist but the definition is not yet complete; the form picks the wording.
		 */
		incompleteHint: {
			type: String,
			default: '',
		},
	},
	emits: ['add'],
	computed: {
		/** ID column + user columns + the filler column that closes the header row. */
		spanColumnsCount(): number
		{
			return this.columns.length + 2;
		},
		hasColumns(): boolean
		{
			return this.columns.length > 0;
		},
		showLoader(): boolean
		{
			return this.errorMessage === '' && this.isLoading;
		},
		/** A table without columns offers the first parameter instead of explaining that it is empty. */
		showEmptyState(): boolean
		{
			return !this.showLoader && this.errorMessage === '' && !this.hasColumns;
		},
		stateMessage(): string
		{
			if (this.errorMessage !== '')
			{
				return this.errorMessage;
			}

			if (!this.hasColumns || this.isReady)
			{
				return '';
			}

			return this.incompleteHint;
		},
		showRows(): boolean
		{
			return !this.showLoader && !this.showEmptyState && this.stateMessage === '' && this.rows.length > 0;
		},
	},
	methods: {
		rowOrdinal(index: number): number
		{
			return (this.page - 1) * this.pageSize + index + 1;
		},
		cellValue(row: Object, code: string): string
		{
			const value = row?.[code];
			if (value === null || value === undefined)
			{
				return '';
			}

			if (Type.isArray(value))
			{
				return value.join(', ');
			}

			if (Type.isPlainObject(value))
			{
				return '';
			}

			return String(value);
		},
	},
	template: `
		<tbody
			data-test-id="bizproc-dataview__preview"
			:aria-busy="isLoading ? 'true' : 'false'"
		>
			<tr v-if="showLoader">
				<td
					:colspan="spanColumnsCount"
					class="bizproc-dataview-grid__cell bizproc-dataview-grid__state"
					data-test-id="bizproc-dataview__preview-loading"
				>
					<PreviewLoader />
				</td>
			</tr>
			<tr v-else-if="showEmptyState">
				<td
					:colspan="spanColumnsCount"
					class="bizproc-dataview-grid__cell bizproc-dataview-grid__state"
					role="status"
					aria-live="polite"
					data-test-id="bizproc-dataview__preview-state"
				>
					<div class="bizproc-dataview-empty">
						<div class="bizproc-dataview-empty__icon" aria-hidden="true">＋</div>
						<div class="bizproc-dataview-empty__title">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_EMPTY_TITLE') }}
						</div>
						<p class="bizproc-dataview-empty__text">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_EMPTY_TEXT') }}
						</p>
						<button
							type="button"
							class="bizproc-dataview-btn --accent-outline bizproc-dataview-empty__action"
							aria-haspopup="dialog"
							data-test-id="bizproc-dataview__preview-add-parameter"
							@click="$emit('add')"
						>
							<span aria-hidden="true">＋</span>
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_PARAMETER') }}
						</button>
					</div>
				</td>
			</tr>
			<tr v-else-if="stateMessage !== ''">
				<td
					:colspan="spanColumnsCount"
					class="bizproc-dataview-grid__cell bizproc-dataview-grid__state"
					:class="{ '--error': errorMessage !== '' }"
					role="status"
					aria-live="polite"
					data-test-id="bizproc-dataview__preview-state"
				>{{ stateMessage }}</td>
			</tr>
			<template v-else-if="showRows">
				<tr v-for="(row, index) in rows" :key="index" class="bizproc-dataview-grid__row">
					<td class="bizproc-dataview-grid__cell">{{ rowOrdinal(index) }}</td>
					<td v-for="column in columns" :key="column.code" class="bizproc-dataview-grid__cell">
						{{ cellValue(row, column.code) }}
					</td>
					<td class="bizproc-dataview-grid__cell"></td>
				</tr>
			</template>
			<tr v-else>
				<td
					:colspan="spanColumnsCount"
					class="bizproc-dataview-grid__cell bizproc-dataview-grid__state"
					role="status"
					aria-live="polite"
					data-test-id="bizproc-dataview__preview-state"
				>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_PREVIEW_NO_ROWS') }}</td>
			</tr>
		</tbody>
	`,
};
