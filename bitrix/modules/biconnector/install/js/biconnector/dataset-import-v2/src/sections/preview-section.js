import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';
import { Hint } from 'ui.hint';

const FOCUS_COLUMN_EVENT = 'biconnector:dataset-import-v2:focus-column';
const FOCUS_FIELD_EVENT = 'biconnector:dataset-import-v2:focus-field';

export const PreviewSection = {
	inject: ['sourceId'],
	data()
	{
		return {
			titleMessage: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_TITLE'),
			emptyMessage: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_EMPTY'),
			allHiddenMessage: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_ALL_HIDDEN'),
			systemEmptyMessage: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_SYSTEM_EMPTY'),
			scrollNextHint: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_SCROLL_NEXT'),
			scrollPrevHint: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_SCROLL_PREV'),
			invalidFormatMessage: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_INVALID_FORMAT'),
			invalidFormatBadge: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_INVALID_FORMAT_BADGE'),
			validatingMessage: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_VALIDATING'),
			reloadingMessage: Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_RELOADING'),
			showScrollNext: false,
			showScrollPrev: false,
			highlight: { left: 0, top: 0, width: 0, height: 0 },
		};
	},
	beforeUnmount()
	{
		this.stopAutoScroll();
		window.removeEventListener('resize', this.onResize);
		EventEmitter.unsubscribe(FOCUS_COLUMN_EVENT, this.onFocusColumnEvent);
	},
	computed:
	{
		...mapGetters([
			'hasData',
			'isSystem',
			'activeFieldIndex',
			'isValidating',
			'isReloadingPreview',
			'validationErrorsByField',
			'validationErrorCellSet',
			'validationErrors',
		]),
		showLoader()
		{
			return this.isValidating || this.isReloadingPreview;
		},
		loaderMessage()
		{
			return this.isReloadingPreview ? this.reloadingMessage : this.validatingMessage;
		},
		totalErrorCount()
		{
			return this.visibleColumns.reduce((sum, column) => sum + column.errorCount, 0);
		},
		hasErrors()
		{
			return this.totalErrorCount > 0;
		},
		fieldsSettings()
		{
			return this.$store.state.config.fieldsSettings;
		},
		previewRows()
		{
			return this.$store.state.previewData.rows;
		},
		visibleColumns()
		{
			const errorCounts = this.validationErrorsByField;
			const columns = [];
			this.fieldsSettings.forEach((field, index) => {
				if (field.visible)
				{
					columns.push({
						field,
						index,
						errorCount: errorCounts[index] ?? 0,
					});
				}
			});

			return columns;
		},
		visibleFields()
		{
			return this.visibleColumns.map((column) => column.field);
		},
		previewEmptyMessage()
		{
			if (this.isSystem && !this.hasData)
			{
				return this.systemEmptyMessage;
			}

			if (this.hasData && this.visibleFields.length === 0)
			{
				return this.allHiddenMessage;
			}

			return this.emptyMessage;
		},
		isExternalConnection()
		{
			return this.sourceId !== 'csv' && this.sourceId !== 'system';
		},
		previewNoticeMessage()
		{
			if (this.hasData && (this.isSystem || this.isExternalConnection))
			{
				return this.systemEmptyMessage;
			}

			return '';
		},
		activeVisibleColumnIndex()
		{
			const idx = this.activeFieldIndex;
			if (idx < 0)
			{
				return -1;
			}

			return this.visibleColumns.findIndex((column) => column.index === idx);
		},
	},
	watch:
	{
		activeVisibleColumnIndex(value)
		{
			if (value < 0)
			{
				return;
			}
			this.$nextTick(() => {
				this.scrollColumnIntoView(value);
				this.updateHighlight();
			});
		},
		visibleColumns()
		{
			this.$nextTick(() => {
				this.updateScrollState();
				this.updateHighlight();
				this.refreshHints();
			});
		},
		previewRows()
		{
			this.$nextTick(() => {
				this.updateScrollState();
				this.updateHighlight();
			});
		},
	},
	mounted()
	{
		this.onResize = () => this.updateHighlight();
		window.addEventListener('resize', this.onResize);
		this.onFocusColumnEvent = (event) => {
			const data = event?.data ?? event;
			const fieldIndex = Array.isArray(data) ? data[0]?.index : data?.index;
			if (typeof fieldIndex !== 'number')
			{
				return;
			}
			const visibleIndex = this.visibleColumns.findIndex((column) => column.index === fieldIndex);
			if (visibleIndex < 0)
			{
				return;
			}
			this.$nextTick(() => this.scrollColumnIntoView(visibleIndex));
		};
		EventEmitter.subscribe(FOCUS_COLUMN_EVENT, this.onFocusColumnEvent);
		this.$nextTick(() => {
			this.updateScrollState();
			this.updateHighlight();
			this.refreshHints();
		});
	},
	methods:
	{
		refreshHints()
		{
			if (!this.$el || typeof this.$el.querySelectorAll !== 'function')
			{
				return;
			}
			this.$el.querySelectorAll('[data-hint-init]').forEach((node) => {
				node.removeAttribute('data-hint-init');
			});
			Hint.init(this.$el);
		},
		formatCell(value)
		{
			if (value === null || value === undefined)
			{
				return '';
			}

			return String(value);
		},
		cellHasError(rowIndex, fieldIndex)
		{
			return this.validationErrorCellSet.has(`${rowIndex}_${fieldIndex}`);
		},
		updateScrollState()
		{
			const scroll = this.$refs.scroll;
			if (!scroll)
			{
				this.showScrollNext = false;
				this.showScrollPrev = false;

				return;
			}
			this.showScrollPrev = scroll.scrollLeft > 4;
			this.showScrollNext = scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft > 4;
		},
		onScroll()
		{
			this.updateScrollState();
		},
		startAutoScroll(direction)
		{
			this.stopAutoScroll();
			const stepPx = 6;
			const tick = () => {
				const scroll = this.$refs.scroll;
				if (!scroll)
				{
					return;
				}
				scroll.scrollLeft += direction * stepPx;
				this.updateScrollState();
				const canContinue = direction > 0 ? this.showScrollNext : this.showScrollPrev;
				if (canContinue)
				{
					this.scrollRafId = requestAnimationFrame(tick);
				}
				else
				{
					this.scrollRafId = null;
				}
			};
			this.scrollRafId = requestAnimationFrame(tick);
		},
		stopAutoScroll()
		{
			if (this.scrollRafId)
			{
				cancelAnimationFrame(this.scrollRafId);
				this.scrollRafId = null;
			}
		},
		scrollColumnIntoView(visibleIndex)
		{
			const scroll = this.$refs.scroll;
			if (!scroll)
			{
				return;
			}
			const th = scroll.querySelectorAll('.biconnector-dataset-import-v2-preview__th')[visibleIndex];
			if (!th)
			{
				return;
			}
			const colLeft = th.offsetLeft;
			const colRight = colLeft + th.offsetWidth;
			const viewLeft = scroll.scrollLeft;
			const viewRight = viewLeft + scroll.clientWidth;
			let target = null;
			if (colLeft < viewLeft)
			{
				target = colLeft;
			}
			else if (colRight > viewRight)
			{
				target = colRight - scroll.clientWidth;
			}
			if (target !== null)
			{
				scroll.scrollTo({ left: target, behavior: 'smooth' });
			}
		},
		onColumnClick(fieldIndex)
		{
			this.$store.commit('setActiveFieldIndex', fieldIndex);
			EventEmitter.emit(FOCUS_FIELD_EVENT, { index: fieldIndex });
		},
		updateHighlight()
		{
			const visibleIndex = this.activeVisibleColumnIndex;
			if (visibleIndex < 0)
			{
				return;
			}
			const scroll = this.$refs.scroll;
			if (!scroll)
			{
				return;
			}
			const th = scroll.querySelectorAll('.biconnector-dataset-import-v2-preview__th')[visibleIndex];
			const table = scroll.querySelector('.biconnector-dataset-import-v2-preview__table');
			if (!th || !table)
			{
				return;
			}
			const next = {
				left: th.offsetLeft,
				top: table.offsetTop,
				width: th.offsetWidth,
				height: table.offsetHeight,
			};
			if (
				next.left === this.highlight.left
				&& next.top === this.highlight.top
				&& next.width === this.highlight.width
				&& next.height === this.highlight.height
			)
			{
				return;
			}
			this.highlight = next;
		},
	},
	// language=Vue
	template: `
		<section class="biconnector-dataset-import-v2-preview">
			<header class="biconnector-dataset-import-v2-preview__header">
				<span class="biconnector-dataset-import-v2-preview__icon ui-icon-set --o-graphs-diagram"></span>
				<span class="biconnector-dataset-import-v2-preview__title ui-typography-text-md">{{ titleMessage }}</span>
				<span
					v-if="hasErrors"
					class="biconnector-dataset-import-v2-preview__header-badge"
				>
					<span class="biconnector-dataset-import-v2-preview__header-badge-icon ui-icon-set --o-alert-accent"></span>
					<span class="biconnector-dataset-import-v2-preview__header-badge-text ui-typography-text-sm">{{ invalidFormatBadge }}</span>
					<span class="biconnector-dataset-import-v2-preview__header-badge-count">{{ totalErrorCount }}</span>
				</span>
			</header>
			<div
				v-if="previewNoticeMessage"
				class="biconnector-dataset-import-v2-preview__subtitle ui-typography-text-sm"
			>{{ previewNoticeMessage }}</div>

			<div v-if="!hasData || visibleFields.length === 0" class="biconnector-dataset-import-v2-preview__empty">
				{{ previewEmptyMessage }}
			</div>

			<div v-else class="biconnector-dataset-import-v2-preview__scroll-wrapper">
				<template v-if="showLoader">
					<div class="biconnector-dataset-import-v2-preview__loader-bg"></div>
					<div class="biconnector-dataset-import-v2-preview__sticky-anchor">
						<div
							class="biconnector-dataset-import-v2-preview__loader-indicator"
							role="status"
							aria-live="polite"
						>
							<span class="biconnector-dataset-import-v2-preview__loader-spinner"></span>
							<span class="biconnector-dataset-import-v2-preview__loader-text ui-typography-text-sm">{{ loaderMessage }}</span>
						</div>
					</div>
				</template>
				<div
					v-if="showScrollPrev || showScrollNext"
					class="biconnector-dataset-import-v2-preview__sticky-anchor"
				>
					<div
						v-if="showScrollPrev"
						class="biconnector-dataset-import-v2-preview__scroll-ear biconnector-dataset-import-v2-preview__scroll-ear--prev"
						:title="scrollPrevHint"
						@mouseenter="startAutoScroll(-1)"
						@mouseleave="stopAutoScroll"
					>
						<span class="ui-icon-set --chevron-left"></span>
					</div>
					<div
						v-if="showScrollNext"
						class="biconnector-dataset-import-v2-preview__scroll-ear biconnector-dataset-import-v2-preview__scroll-ear--next"
						:title="scrollNextHint"
						@mouseenter="startAutoScroll(1)"
						@mouseleave="stopAutoScroll"
					>
						<span class="ui-icon-set --chevron-right"></span>
					</div>
				</div>
				<div
					ref="scroll"
					class="biconnector-dataset-import-v2-preview__scroll"
					@scroll="onScroll"
				>
					<div
						class="biconnector-dataset-import-v2-preview__column-highlight"
						:class="{ 'biconnector-dataset-import-v2-preview__column-highlight--visible': activeVisibleColumnIndex >= 0 }"
						:style="{ left: highlight.left + 'px', top: highlight.top + 'px', width: highlight.width + 'px', height: highlight.height + 'px' }"
					></div>
					<table class="biconnector-dataset-import-v2-preview__table">
						<thead>
							<tr class="biconnector-dataset-import-v2-preview__head-row">
								<th
									v-for="column in visibleColumns"
									:key="column.field.id || column.index"
									class="biconnector-dataset-import-v2-preview__th"
									@click="onColumnClick(column.index)"
								>
									<div class="biconnector-dataset-import-v2-preview__th-content">
										<span class="biconnector-dataset-import-v2-preview__col-name ui-typography-text-sm">{{ column.field.name }}</span>
										<span
											v-if="column.errorCount > 0"
											class="biconnector-dataset-import-v2-preview__col-badge"
										>{{ column.errorCount }}</span>
										<span
											v-if="column.field.description"
											class="biconnector-dataset-import-v2-preview__col-hint"
											:data-hint="column.field.description"
											data-hint-outline
										></span>
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="(row, rowIndex) in previewRows"
								:key="rowIndex"
								class="biconnector-dataset-import-v2-preview__tr"
							>
								<td
									v-for="column in visibleColumns"
									:key="column.field.id || column.index"
									class="biconnector-dataset-import-v2-preview__td ui-typography-text-sm"
									:class="{ 'biconnector-dataset-import-v2-preview__td--error': cellHasError(rowIndex, column.index) }"
									:title="cellHasError(rowIndex, column.index) ? invalidFormatMessage : null"
									@click="onColumnClick(column.index)"
								>{{ formatCell(row[column.index]) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>
	`,
};
