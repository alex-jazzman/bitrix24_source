import { Loc, Text, Type } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Center as Notifier } from 'ui.notification';
import {
	ERROR_CATEGORY,
	OPERATION,
	PERIOD_MODE,
	PREVIEW_PAGE_SIZE_DEFAULT,
	generateColumnCode,
	mapError,
} from 'bizproc.dataview';
import { FeatureCode } from 'bizprocdesigner.feature';

import { InspectorCloseButton } from '../../../entities/node-data-inspector';
import { useFeature } from '../../../shared/composables/feature';
import { IconButton } from '../../../shared/ui';
import { focusFirstAvailable } from '../../../shared/utils';
import { dataViewEditorApi } from '../api';
import { EDITOR_MODE, useDataViewDefinitionStore, GENERAL_VALIDATION_FIELD } from '../stores/definition-store';
import { isSourceRefFilled, sourceKey, useDataViewMetaStore } from '../stores/meta-store';
import { AddParameterDialog } from './add-parameter-dialog';
import { AggregatePanel } from './aggregate-panel';
import { ColumnEditor } from './column-editor';
import { MonthField } from './month-field';
import { PreviewGrid } from './preview-grid';
import { PreviewPager } from './preview-pager';
import { resolveSourceDescriptor, sourceDescriptorTitle } from './source-selector';
import { ValueModifierDialog } from './value-modifier-dialog';

const PREVIEW_DEBOUNCE_MS = 350;
/** Rounding of the scroll offsets leaves a fraction of a pixel at either edge of the preview. */
const SCROLL_EDGE_EPSILON = 1;
const SCROLL_STEP_RATIO = 0.8;

let formInstanceCounter = 0;

/**
 * The editor: the header with the title and the description of the table, the period select, the
 * interactive table with a live preview, the pager line, the grouping and totals of the whole table
 * ({@see AggregatePanel}) and the footer actions.
 * What the view reads and how it combines it — the operation and the sources — is picked in
 * {@see AddParameterDialog}, together with the columns themselves; whatever the backend rejects there
 * is reported back here, next to the table. Every field of the definition is read from and written to
 * {@see useDataViewDefinitionStore} — the form keeps no copy of its own; only the preview (rows,
 * paging, its own error) is local, because it is a view of the definition rather than part of it. The
 * dialog chrome lives in {@see DataViewEditorWindow}.
 */
// @vue/component
export const DataViewEditorForm = {
	name: 'BizprocDataViewEditorForm',
	components: {
		AddParameterDialog,
		AggregatePanel,
		BIcon,
		ColumnEditor,
		IconButton,
		InspectorCloseButton,
		MonthField,
		PreviewGrid,
		PreviewPager,
		ValueModifierDialog,
	},
	props: {
		/** @type DataViewApiClient */
		apiClient: {
			type: Object,
			default: (): Object => dataViewEditorApi,
		},
	},
	setup(): Object
	{
		return {
			definitionStore: useDataViewDefinitionStore(),
			metaStore: useDataViewMetaStore(),
			...useFeature(),
		};
	},
	data(): Object
	{
		return {
			fieldUid: `bizproc-dataview-form-${++formInstanceCounter}`,
			previewRows: [],
			// Columns the preview answered with. For an aggregate these are the result columns (grouping
			// fields + totals) the rows are keyed by, which differ from the projected source columns.
			previewColumns: [],
			totalRows: 0,
			page: 1,
			pageSize: PREVIEW_PAGE_SIZE_DEFAULT,
			previewError: '',
			previewErrorCategory: '',
			isLoadingPreview: false,
			isAddDialogOpen: false,
			isModifyDialogOpen: false,
			modifyColumnCode: '',
			isDescriptionOpen: false,
			canScrollBack: false,
			canScrollForward: false,
		};
	},
	computed: {
		title: {
			get(): string
			{
				return this.definitionStore.title;
			},
			set(value: string): void
			{
				this.definitionStore.setTitle(value);
			},
		},
		description: {
			get(): string
			{
				return this.definitionStore.description;
			},
			set(value: string): void
			{
				this.definitionStore.setDescription(value);
			},
		},
		headerCaption(): string
		{
			return this.definitionStore.mode === EDITOR_MODE.CREATE
				? Loc.getMessage('BIZPROC_JS_DATAVIEW_TITLE_CREATE')
				: Loc.getMessage('BIZPROC_JS_DATAVIEW_TITLE');
		},
		/**
		 * A description an edited view already carries opens the field on its own, so hydrating one
		 * shows it without the link; an empty one stays behind the link until it is asked for.
		 */
		isDescriptionShown(): boolean
		{
			return this.isDescriptionOpen || Type.isStringFilled(this.description);
		},
		resetIcon: (): string => Outline.CROSS_L,
		scrollBackIcon: (): string => Outline.CHEVRON_LEFT_L,
		scrollForwardIcon: (): string => Outline.CHEVRON_RIGHT_L,
		hasColumns(): boolean
		{
			return this.tableColumns.length > 0;
		},
		periodMode: {
			get(): string
			{
				return this.definitionStore.period.mode;
			},
			set(mode: string): void
			{
				this.definitionStore.setPeriod({ ...this.definitionStore.period, mode });
			},
		},
		periodMonth: {
			get(): string
			{
				return this.definitionStore.period.month;
			},
			set(month: string): void
			{
				this.definitionStore.setPeriod({ ...this.definitionStore.period, month });
			},
		},
		columns(): Array<Object>
		{
			return this.definitionStore.columns;
		},
		isAggregate(): boolean
		{
			return this.definitionStore.operation === OPERATION.AGGREGATE;
		},
		/**
		 * Columns the interactive table renders — headers and cells alike. An aggregate's rows come keyed
		 * by the backend's result columns (grouping fields + totals), which differ from the projected
		 * source columns; once a preview has answered, the table follows those so the totals show values.
		 * A join or a project returns the projected columns unchanged, and before the first answer there
		 * is nothing else to show, so both fall back to the definition's own columns.
		 * A result column carries neither source nor kind, so one the definition knows by code — a
		 * grouped field or a stamp — is taken from the definition instead: that is what its chip menu is
		 * built from. A total answers to no projected column and stays as it came, with nothing to offer.
		 */
		tableColumns(): Array<Object>
		{
			if (this.isAggregate && this.previewColumns.length > 0)
			{
				const definedByCode = new Map(this.columns.map((column) => [column.code, column]));

				return this.previewColumns.map((column) => definedByCode.get(column.code) ?? column);
			}

			return this.columns;
		},
		/**
		 * Whether a column may be dropped straight from its chip. An aggregate's result columns are
		 * governed by the grouping checkboxes and the totals panel, not by the chip, so it offers no
		 * removal there; the add button stays, since it still projects a source field to group or total.
		 */
		areColumnsRemovable(): boolean
		{
			return !this.isAggregate;
		},
		/**
		 * Whether a column opens {@see ValueModifierDialog} from its chip. All the dialog offers is the
		 * formula builder, so without the flags that bring it the item would only lead to an empty window.
		 */
		areColumnsModifiable(): boolean
		{
			return this.isFeatureAvailable(FeatureCode.expressionBuilder)
				&& this.isFeatureAvailable(FeatureCode.dataTables);
		},
		periodModes(): Array<string>
		{
			return [PERIOD_MODE.CURRENT, PERIOD_MODE.PREVIOUS, PERIOD_MODE.CALENDAR];
		},
		columnsCountLabel(): string
		{
			const count = this.tableColumns.length;
			if (count < 1)
			{
				return Loc.getMessage('BIZPROC_JS_DATAVIEW_COLUMNS_COUNT_EMPTY');
			}

			return Loc.getMessagePlural('BIZPROC_JS_DATAVIEW_COLUMNS_COUNT', count, { '#COUNT#': count });
		},
		isCalendarPeriod(): boolean
		{
			return this.periodMode === PERIOD_MODE.CALENDAR;
		},
		isHydrating(): boolean
		{
			return this.definitionStore.isHydrating;
		},
		isReady(): boolean
		{
			return this.definitionStore.isComplete;
		},
		/**
		 * What the table still needs before it previews, phrased for the current operation: a join
		 * wants its second source and key, an aggregate its grouping and totals. A projection has no
		 * such in-between — one source with columns is already complete — so it reuses the empty-table
		 * wording, which the grid shows on its own while the projection has no columns yet.
		 */
		incompleteHint(): string
		{
			if (this.definitionStore.operation === OPERATION.JOIN)
			{
				return Loc.getMessage('BIZPROC_JS_DATAVIEW_PREVIEW_NEEDS_JOIN');
			}

			if (this.definitionStore.operation === OPERATION.AGGREGATE)
			{
				return Loc.getMessage('BIZPROC_JS_DATAVIEW_PREVIEW_NEEDS_AGGREGATE');
			}

			return Loc.getMessage('BIZPROC_JS_DATAVIEW_EMPTY_TABLE');
		},
		canSave(): boolean
		{
			return this.definitionStore.canSave;
		},
		isTitleMissing(): boolean
		{
			return !this.isHydrating && !Type.isStringFilled(this.title.trim());
		},
		definitionKey(): string
		{
			const definition = this.definitionStore.definition;

			return definition === null ? '' : JSON.stringify(definition);
		},
		/**
		 * The preview is a picture of the definition: while the edited view is still loading there is
		 * no definition to picture yet, and the rows of the previous one would be a stale frame.
		 */
		isPreviewLoading(): boolean
		{
			return this.isLoadingPreview || this.isHydrating;
		},
		isRetryablePreviewError(): boolean
		{
			return this.previewErrorCategory === ERROR_CATEGORY.RETRYABLE;
		},
		validationErrors(): Object
		{
			return this.definitionStore.validationErrors;
		},
		generalError(): string
		{
			return this.validationErrors[GENERAL_VALIDATION_FIELD]?.message ?? '';
		},
		columnsError(): string
		{
			return this.validationErrors.columns?.message ?? '';
		},
		periodError(): string
		{
			return this.validationErrors.period?.message ?? '';
		},
		sourcesError(): string
		{
			return this.validationErrors.sources?.message ?? '';
		},
		joinError(): string
		{
			return this.validationErrors.joinKeys?.message ?? '';
		},
		aggregateError(): string
		{
			return this.validationErrors.aggregate?.message ?? '';
		},
		/** Human labels of the source aliases, for the column chips. */
		sourceTitles(): Object
		{
			return Object.fromEntries(this.definitionStore.sources.map((source) => [
				source.alias,
				sourceDescriptorTitle(resolveSourceDescriptor(this.metaStore, source)),
			]));
		},
	},
	watch: {
		definitionKey(key: string): void
		{
			if (this.isHydrating)
			{
				return;
			}

			this.page = 1;
			if (key === '')
			{
				this.clearPreview();

				return;
			}

			this.schedulePreview();
		},
		tableColumns: 'scheduleScrollStateUpdate',
		previewRows: 'scheduleScrollStateUpdate',
	},
	created(): void
	{
		this.previewTimer = null;
		this.lastPreviewFetchId = 0;
	},
	async mounted(): Promise<void>
	{
		await Promise.all([
			// The template the editor was opened for decides what the catalog offers: only its own
			// editor sees that template's constants and variables among the sources (API-06).
			this.metaStore.loadSources(this.definitionStore.templateId),
			this.definitionStore.load(),
		]);

		// Hydrating an edited view moves the definition, so the watcher below has already taken the
		// preview upon itself. Mounting only makes that first preview immediate instead of debounced,
		// and once one has gone out there is nothing left here to do.
		if (this.definitionStore.isComplete && this.lastPreviewFetchId === 0)
		{
			this.runPreview();
		}

		this.updateScrollState();
	},
	beforeUnmount(): void
	{
		this.cancelScheduledPreview();
	},
	methods: {
		periodModeLabel(mode: string): string
		{
			const codes = {
				[PERIOD_MODE.CURRENT]: 'BIZPROC_JS_DATAVIEW_PERIOD_MODE_CURRENT',
				[PERIOD_MODE.PREVIOUS]: 'BIZPROC_JS_DATAVIEW_PERIOD_MODE_PREVIOUS',
				[PERIOD_MODE.CALENDAR]: 'BIZPROC_JS_DATAVIEW_PERIOD_MODE_CALENDAR',
			};

			return Loc.getMessage(codes[mode]);
		},
		openDescription(): void
		{
			this.isDescriptionOpen = true;
			this.$nextTick(() => {
				this.$refs.descriptionField?.focus();
			});
		},
		/**
		 * The reset button goes away with the description it clears, so the focus moves to the button
		 * that takes its place.
		 */
		resetDescription(): void
		{
			this.description = '';
			this.isDescriptionOpen = false;
			this.$nextTick(() => {
				focusFirstAvailable(this.$refs.descriptionAddButton);
			});
		},
		scheduleScrollStateUpdate(): void
		{
			this.$nextTick(this.updateScrollState);
		},
		updateScrollState(): void
		{
			const scroll = this.$refs.gridScroll;
			if (!scroll)
			{
				return;
			}

			const forward = scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft;
			this.canScrollBack = scroll.scrollLeft > SCROLL_EDGE_EPSILON;
			this.canScrollForward = forward > SCROLL_EDGE_EPSILON;
		},
		scrollPreview(direction: number): void
		{
			const scroll = this.$refs.gridScroll;
			scroll?.scrollBy({
				left: direction * scroll.clientWidth * SCROLL_STEP_RATIO,
				behavior: 'smooth',
			});
		},
		openAddDialog(): void
		{
			this.isAddDialogOpen = true;
		},
		closeAddDialog(): void
		{
			this.isAddDialogOpen = false;
		},
		openModifyDialog(column: ?Object): void
		{
			this.modifyColumnCode = column?.code ?? '';
			this.isModifyDialogOpen = true;
		},
		closeModifyDialog(): void
		{
			this.isModifyDialogOpen = false;
			this.modifyColumnCode = '';
		},
		/**
		 * Projects one picked field, unless the column list already reads it.
		 *
		 * @return {boolean} false when the very same field is already projected
		 */
		appendColumn(payload: Object): boolean
		{
			if (payload?.kind === 'constant')
			{
				const constant = payload.constant;
				if (!isSourceRefFilled(constant))
				{
					return false;
				}

				const constantKey = sourceKey(constant);
				if (this.columns.some(
					(column) => column.kind === 'constant' && sourceKey(column.constant) === constantKey,
				))
				{
					return false;
				}

				const baseCode = String(constant.params?.code ?? 'CONSTANT');
				const code = generateColumnCode(baseCode, this.columns.map((column) => column.code));
				const column = {
					code,
					title: Type.isStringFilled(payload.title) ? payload.title : baseCode,
					kind: 'constant',
					constant: {
						module: constant.module,
						entity: constant.entity,
						params: Type.isPlainObject(constant.params) ? { ...constant.params } : {},
					},
				};

				this.definitionStore.setColumns([...this.columns, column]);

				return true;
			}

			if (!Type.isStringFilled(payload.alias))
			{
				return false;
			}

			const source = `${payload.alias}.${payload.field.code}`;
			if (this.columns.some((column) => column.source === source))
			{
				return false;
			}

			const code = generateColumnCode(payload.field.code, this.columns.map((column) => column.code));
			const column = { code, title: payload.title, source };

			this.definitionStore.setColumns([...this.columns, column]);

			return true;
		},
		/**
		 * What the dialog changed about the projection: the columns it built, and the codes of the ones
		 * it unchecked. The join key and the sources they refer to are already in the store — the dialog
		 * writes them as the user picks them.
		 */
		onAddColumns(payload: Object): void
		{
			const removedCodes = payload.removedCodes ?? [];
			if (removedCodes.length > 0)
			{
				this.definitionStore.setColumns(
					this.columns.filter((column) => !removedCodes.includes(column.code)),
				);
			}

			const added = payload.columns.filter((column) => this.appendColumn(column));
			if (added.length < payload.columns.length)
			{
				this.notifyMessage('BIZPROC_JS_DATAVIEW_ADD_DUPLICATE');
			}

			this.closeAddDialog();
		},
		/**
		 * A column is dropped from a menu that closes with it, leaving the focus nowhere; it comes
		 * back to the button that adds the next column.
		 */
		onRemoveColumn(code: string): void
		{
			this.definitionStore.setColumns(this.columns.filter((item) => item.code !== code));
			this.$nextTick(() => {
				focusFirstAvailable(this.$refs.addParameterButton);
			});
		},
		cancelScheduledPreview(): void
		{
			if (this.previewTimer)
			{
				clearTimeout(this.previewTimer);
				this.previewTimer = null;
			}
		},
		schedulePreview(): void
		{
			this.cancelScheduledPreview();

			this.previewTimer = setTimeout(() => {
				this.previewTimer = null;
				this.runPreview();
			}, PREVIEW_DEBOUNCE_MS);
		},
		async runPreview(): Promise<void>
		{
			// Whatever the debounce was waiting to show is what runs right now, so the pending call
			// would only repeat this one and blank the grid a second time.
			this.cancelScheduledPreview();

			const definition = this.definitionStore.definition;
			if (definition === null)
			{
				this.clearPreview();

				return;
			}

			const fetchId = ++this.lastPreviewFetchId;
			this.isLoadingPreview = true;
			this.previewError = '';
			this.previewErrorCategory = '';
			try
			{
				// The owner rides along with the preview exactly as it does with the save: a definition
				// reading sources of a template is previewable only under that template.
				const result = await this.apiClient.preview(definition, {
					page: this.page,
					pageSize: this.pageSize,
					ownerTemplateId: this.definitionStore.templateId,
				});
				if (this.lastPreviewFetchId !== fetchId)
				{
					return;
				}

				this.previewRows = Type.isArray(result?.rows) ? result.rows : [];
				this.previewColumns = Type.isArray(result?.columns) ? result.columns : [];
				this.totalRows = Type.isNumber(result?.totalRows) ? result.totalRows : this.previewRows.length;
				// A definition that previews validates as a whole, so any earlier field verdict is stale.
				this.definitionStore.clearValidationErrors();
			}
			catch (error)
			{
				if (this.lastPreviewFetchId !== fetchId)
				{
					return;
				}

				this.previewRows = [];
				this.previewColumns = [];
				this.totalRows = 0;

				// A rejected validation is shown under its own controls, not as a banner over the table.
				if (this.definitionStore.applyServerValidation(error))
				{
					this.previewError = '';
					this.previewErrorCategory = '';

					return;
				}

				const mapped = mapError(error);
				this.previewError = Loc.getMessage(mapped.messageCode);
				this.previewErrorCategory = mapped.category;
			}
			finally
			{
				if (this.lastPreviewFetchId === fetchId)
				{
					this.isLoadingPreview = false;
				}
			}
		},
		clearPreview(): void
		{
			this.previewRows = [];
			this.previewColumns = [];
			this.totalRows = 0;
			this.previewError = '';
			this.previewErrorCategory = '';
		},
		onPageChange(page: number): void
		{
			this.page = page;
			this.runPreview();
		},
		onPageSizeChange(pageSize: number): void
		{
			this.pageSize = pageSize;
			this.page = 1;
			this.runPreview();
		},
		async onSave(): Promise<void>
		{
			if (!this.canSave)
			{
				return;
			}

			try
			{
				const item = await this.definitionStore.save();
				if (item === null)
				{
					return;
				}

				this.notifySuccess(item);
				this.definitionStore.handleSaved(item);
			}
			catch (error)
			{
				this.presentError(error);
			}
		},
		onCancel(): void
		{
			this.definitionStore.close();
		},
		/**
		 * Presents a failure of an action the user asked for. A request that may still succeed is worth
		 * another try, so it only gets a notification; anything else has no way forward from here and
		 * blocks until acknowledged.
		 */
		presentError(error: ?Object): void
		{
			const mapped = mapError(error);
			const message = Loc.getMessage(mapped.messageCode);
			if (mapped.category === ERROR_CATEGORY.RETRYABLE)
			{
				Notifier.notify({ content: Text.encode(message) });

				return;
			}

			MessageBox.alert(message);
		},
		notifySuccess(result: ?Object): void
		{
			Notifier.notify({
				content: Loc.getMessage('BIZPROC_JS_DATAVIEW_SAVE_SUCCESS', {
					'#ID#': Text.encode(String(result?.id ?? '')),
				}),
			});
		},
		notifyMessage(messageCode: string): void
		{
			Notifier.notify({ content: Loc.getMessage(messageCode) });
		},
	},
	template: `
		<div class="bizproc-dataview-window" data-test-id="bizproc-dataview__app">
			<div class="bizproc-dataview-header">
				<div class="bizproc-dataview-header__top">
					<div class="bizproc-dataview-header__caption" data-test-id="bizproc-dataview__caption">
						{{ headerCaption }}
					</div>
					<InspectorCloseButton
						data-test-id="bizproc-dataview__panel-close"
						@click="onCancel"
					/>
				</div>
				<input
					type="text"
					:id="fieldUid + '-title'"
					class="bizproc-dataview-header__title"
					v-model="title"
					aria-required="true"
					:aria-invalid="isTitleMissing ? 'true' : null"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_TITLE_LABEL')"
					:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_TITLE_PLACEHOLDER')"
					data-test-id="bizproc-dataview__title"
				>
				<button
					v-if="!isDescriptionShown"
					ref="descriptionAddButton"
					type="button"
					class="bizproc-dataview-header__description-link"
					data-test-id="bizproc-dataview__description-add"
					@click="openDescription"
				>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_DESCRIPTION_ADD') }}</button>
				<div v-else class="bizproc-dataview-header__description">
					<textarea
						ref="descriptionField"
						:id="fieldUid + '-description'"
						class="bizproc-dataview__textarea bizproc-dataview-header__description-field"
						v-model="description"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_DESCRIPTION_LABEL')"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_DESCRIPTION_PLACEHOLDER')"
						data-test-id="bizproc-dataview__description"
					></textarea>
					<button
						type="button"
						class="bizproc-dataview-header__description-reset"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_DESCRIPTION_RESET')"
						data-test-id="bizproc-dataview__description-reset"
						@click="resetDescription"
					>
						<BIcon :name="resetIcon" :size="18" aria-hidden="true" />
					</button>
				</div>
			</div>
			<div class="bizproc-dataview-window__body">
				<div class="bizproc-dataview__field" data-test-id="bizproc-dataview__period">
					<label class="bizproc-dataview__field-label" :for="fieldUid + '-period'">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_PERIOD_TITLE') }}
					</label>
					<select
						:id="fieldUid + '-period'"
						class="bizproc-dataview__select"
						v-model="periodMode"
						data-test-id="bizproc-dataview__period-mode"
					>
						<option v-for="mode in periodModes" :key="mode" :value="mode">
							{{ periodModeLabel(mode) }}
						</option>
					</select>
					<p
						v-if="periodError !== ''"
						class="bizproc-dataview__error"
						role="alert"
						data-test-id="bizproc-dataview__period-error"
					>{{ periodError }}</p>
					<p class="bizproc-dataview__hint" data-test-id="bizproc-dataview__period-hint">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_PERIOD_HINT') }}
					</p>
				</div>
				<div v-if="isCalendarPeriod" class="bizproc-dataview__field">
					<label class="bizproc-dataview__field-label" :for="fieldUid + '-month'">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_PERIOD_MONTH_LABEL') }}
					</label>
					<MonthField
						v-model="periodMonth"
						:id="fieldUid + '-month'"
						data-test-id="bizproc-dataview__period-month"
					/>
				</div>
				<div class="bizproc-dataview-section">
					<div class="bizproc-dataview-section__title" data-test-id="bizproc-dataview__columns-title">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_COLUMNS_SECTION') }}
					</div>
					<div class="bizproc-dataview-section__counter" data-test-id="bizproc-dataview__columns-count">
						{{ columnsCountLabel }}
					</div>
					<button
						ref="addParameterButton"
						type="button"
						class="bizproc-dataview-btn --accent"
						aria-haspopup="dialog"
						data-test-id="bizproc-dataview__add-parameter"
						@click="openAddDialog"
					>
						<span aria-hidden="true">＋</span>
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_PARAMETER') }}
					</button>
				</div>
				<p
					v-if="isAggregate"
					class="bizproc-dataview__intro"
					data-test-id="bizproc-dataview__columns-aggregate-hint"
				>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_COLUMNS_AGGREGATE_HINT') }}</p>
				<div class="bizproc-dataview-grid">
					<div ref="gridScroll" class="bizproc-dataview-grid__scroll" @scroll="updateScrollState">
						<table class="bizproc-dataview-grid__table">
							<ColumnEditor
								v-if="hasColumns"
								:columns="tableColumns"
								:source-labels="sourceTitles"
								:removable="areColumnsRemovable"
								:modifiable="areColumnsModifiable"
								@edit="openAddDialog"
								@modify="openModifyDialog"
								@remove="onRemoveColumn"
							/>
							<PreviewGrid
								:columns="tableColumns"
								:rows="previewRows"
								:page="page"
								:page-size="pageSize"
								:is-loading="isPreviewLoading"
								:error-message="previewError"
								:is-ready="isReady"
								:incomplete-hint="incompleteHint"
								@add="openAddDialog"
							/>
						</table>
					</div>
					<IconButton
						v-if="canScrollBack"
						class="bizproc-dataview-grid__nav --prev"
						:icon-name="scrollBackIcon"
						:size="20"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SCROLL_BACK')"
						data-test-id="bizproc-dataview__scroll-back"
						@click="scrollPreview(-1)"
					/>
					<IconButton
						v-if="canScrollForward"
						class="bizproc-dataview-grid__nav --next"
						:icon-name="scrollForwardIcon"
						:size="20"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SCROLL_FORWARD')"
						data-test-id="bizproc-dataview__scroll-forward"
						@click="scrollPreview(1)"
					/>
					<PreviewPager
						:page="page"
						:page-size="pageSize"
						:total-rows="totalRows"
						:is-loading="isPreviewLoading"
						@update:page="onPageChange"
						@update:page-size="onPageSizeChange"
					/>
				</div>
				<div v-if="isRetryablePreviewError" class="bizproc-dataview__retry">
					<button
						type="button"
						class="bizproc-dataview-btn --ghost"
						data-test-id="bizproc-dataview__preview-retry"
						@click="runPreview"
					>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_PREVIEW_RETRY') }}</button>
				</div>
				<p
					v-if="columnsError !== ''"
					class="bizproc-dataview__error"
					role="alert"
					data-test-id="bizproc-dataview__columns-error"
				>{{ columnsError }}</p>
				<p
					v-if="sourcesError !== ''"
					class="bizproc-dataview__error"
					role="alert"
					data-test-id="bizproc-dataview__definition-sources-error"
				>{{ sourcesError }}</p>
				<p
					v-if="joinError !== ''"
					class="bizproc-dataview__error"
					role="alert"
					data-test-id="bizproc-dataview__definition-join-error"
				>{{ joinError }}</p>
				<AggregatePanel :aggregate-error="aggregateError" />
			</div>
			<div class="bizproc-dataview-window__footer">
				<button
					type="button"
					class="bizproc-dataview-btn --primary"
					:disabled="!canSave"
					:aria-describedby="canSave ? null : (fieldUid + '-save-hint')"
					data-test-id="bizproc-dataview__save-button"
					@click="onSave"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SAVE_BUTTON') }}
				</button>
				<span
					v-if="!canSave"
					:id="fieldUid + '-save-hint'"
					class="bizproc-dataview__visually-hidden"
					data-test-id="bizproc-dataview__save-hint"
				>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SAVE_DISABLED_HINT') }}</span>
				<button
					type="button"
					class="bizproc-dataview-btn --ghost"
					data-test-id="bizproc-dataview__cancel-button"
					@click="onCancel"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_CANCEL') }}
				</button>
				<span
					v-if="generalError !== ''"
					class="bizproc-dataview__error"
					role="alert"
					data-test-id="bizproc-dataview__general-error"
				>{{ generalError }}</span>
			</div>
			<AddParameterDialog
				v-if="isAddDialogOpen"
				@add="onAddColumns"
				@close="closeAddDialog"
			/>
			<ValueModifierDialog
				v-if="isModifyDialogOpen"
				:column-code="modifyColumnCode"
				@close="closeModifyDialog"
			/>
		</div>
	`,
};
