import { mapState } from 'ui.vue3.pinia';
import { EventEmitter } from 'main.core.events';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Router } from 'bizproc.router';

import { diagramStore } from '../../../../entities/blocks';
import { useNodeDataViewsStore, buildNodeKey, DATA_VIEWS_EVENTS } from '../../../../entities/node-data-views';
import { useLoc } from '../../../../shared/composables';
import { isTemplateId } from '../../../../shared/utils';
import { type DataViewItem } from '../../../../entities/node-data-views/stores/node-data-views-store';

import './style.css';

// @vue/component
export const DataViewsSection = {
	name: 'DataViewsSection',
	components: {
		BIcon,
	},
	directives: {
		hint,
	},
	props:
	{
		/** @type Block */
		block:
		{
			type: Object,
			required: true,
		},
	},
	setup(): {
		getMessage: (id: string, replacements?: Object) => string;
		dataViewsStore: Object;
		iconSet: typeof Outline;
		}
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			dataViewsStore: useNodeDataViewsStore(),
			iconSet: Outline,
		};
	},
	computed:
	{
		...mapState(useNodeDataViewsStore, ['items', 'isLoading', 'loadedKey']),
		...mapState(diagramStore, ['templateId', 'isWriteLocked']),
		activityName(): string
		{
			return this.block?.activity?.Name ?? '';
		},
		nodeKey(): string
		{
			return buildNodeKey(this.templateId, this.activityName);
		},
		visibleItems(): Array<DataViewItem>
		{

			return this.loadedKey === this.nodeKey ? this.items : [];
		},
		hasVisibleItems(): boolean
		{
			return this.visibleItems.length > 0;
		},
		canCreate(): boolean
		{

			return isTemplateId(this.templateId) && this.activityName !== '';
		},
		createHintOptions(): ?Object
		{
			return this.canCreate
				? null
				: this.hintOptions(this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_CREATE_DISABLED_HINT'));
		},
		createAriaLabel(): ?string
		{
			if (this.canCreate)
			{
				return null;
			}

			const label = this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_CREATE_BUTTON');
			const reason = this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_CREATE_DISABLED_HINT');

			return `${label}. ${reason}`;
		},
		shouldShowList(): boolean
		{
			return !this.isLoading && this.hasVisibleItems;
		},
	},
	watch:
	{
		nodeKey:
		{
			immediate: true,
			handler(): void
			{
				this.loadItems();
			},
		},
	},
	methods:
	{
		loadItems(): void
		{
			if (isTemplateId(this.templateId) && this.activityName)
			{
				this.dataViewsStore.load(this.templateId, this.activityName);
			}
		},
		hintOptions(description: string): Object
		{

			return {
				text: description,
				popupOptions: {
					maxWidth: 320,
					offsetTop: 4,
				},
			};
		},
		onHintEscape(event: KeyboardEvent): void
		{

			event.target?.blur();
		},
		rowsCountText(item: DataViewItem): string
		{
			return String(item.rowsCount ?? 0);
		},
		onOpenRecords(item: DataViewItem): void
		{
			Router.openStorageItemList({
				requestMethod: 'get',
				requestParams: {
					storageId: item.storageTypeId,
				},
			});
		},
		onEdit(item: DataViewItem): void
		{
			this.emitTableSettings(item.storageTypeId);
		},
		onCreate(): void
		{

			if (!this.canCreate)
			{
				return;
			}

			this.emitTableSettings(null);
		},
		emitTableSettings(storageTypeId: ?number): void
		{
			if (this.isWriteLocked)
			{
				return;
			}

			const nodeKey = this.nodeKey;
			EventEmitter.emit(DATA_VIEWS_EVENTS.OPEN_TABLE_SETTINGS, {
				templateId: this.templateId,
				activityName: this.activityName,
				storageTypeId,
				onSaved: (item: DataViewItem): void => {
					this.dataViewsStore.upsert(item, nodeKey);
				},
			});
		},
		onDelete(item: DataViewItem): void
		{
			if (this.isWriteLocked)
			{
				return;
			}

			const deletedIndex = this.visibleItems.findIndex(
				(current: DataViewItem): boolean => current.storageTypeId === item.storageTypeId,
			);

			MessageBox.confirm(
				this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_DELETE_CONFIRM_MESSAGE'),
				this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_DELETE_CONFIRM_TITLE'),
				async (messageBox) => {
					messageBox.close();
					await this.dataViewsStore.remove(item.storageTypeId);
					this.focusAfterRemoval(deletedIndex);
				},
				this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_DELETE_CONFIRM_BUTTON'),
				(messageBox) => {
					messageBox.close();
				},
				this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_DELETE_CANCEL_BUTTON'),
			);
		},
		focusAfterRemoval(deletedIndex: number): void
		{

			this.$nextTick(() => {
				const rows = this.$el?.querySelectorAll('.editor-chart-data-views-section__row') ?? [];
				if (rows.length > 0)
				{
					const targetIndex = Math.min(Math.max(deletedIndex, 0), rows.length - 1);
					const targetRow = rows[targetIndex];
					const focusTarget = targetRow.querySelector('button') ?? targetRow;
					focusTarget.focus();
				}
				else
				{
					this.$refs.createButton?.focus();
				}
			});
		},
	},
	template: `
		<div class="editor-chart-node-settings-form__section editor-chart-data-views-section">
			<div class="editor-chart-node-settings-form__section-header">
				<div class="editor-chart-node-settings-form__section-header-main">
					<BIcon :name="iconSet.DATABASE" :size="26" aria-hidden="true"/>
					<span class="editor-chart-node-settings-form__section-title">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_SECTION_TITLE') }}
					</span>
				</div>
				<span class="editor-chart-node-settings-form__section-description">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_SECTION_DESCRIPTION') }}
				</span>
			</div>
			<div
				v-if="shouldShowList"
				class="editor-chart-data-views-section__list"
				role="table"
				:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_SECTION_TITLE')"
			>
				<div class="editor-chart-data-views-section__columns" role="row">
					<span class="editor-chart-data-views-section__column-title" role="columnheader">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_COLUMN_CREATED') }}
					</span>
					<span class="editor-chart-data-views-section__column-title" role="columnheader">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_COLUMN_DATA') }}
					</span>
				</div>
				<div
					v-for="item in visibleItems"
					:key="item.id"
					class="editor-chart-data-views-section__row"
					role="row"
					:data-test-id="$testId('dataViewsRow', item.storageTypeId)"
				>
					<div class="editor-chart-data-views-section__row-main" role="rowheader">
						<button
							type="button"
							class="editor-chart-data-views-section__name"
							:data-test-id="$testId('dataViewsRowName', item.storageTypeId)"
							@click="onOpenRecords(item)"
						>
							{{ item.title }}
						</button>
						<button
							v-if="item.description"
							type="button"
							v-hint="hintOptions(item.description)"
							class="editor-chart-data-views-section__info"
							:aria-label="item.description"
							@keydown.esc="onHintEscape"
						>
							<BIcon :name="iconSet.INFO_CIRCLE" :size="18" aria-hidden="true"/>
						</button>
					</div>
					<div class="editor-chart-data-views-section__row-data" role="cell">
						<span class="editor-chart-data-views-section__count">
							{{ rowsCountText(item) }}
						</span>
						<div v-if="!isWriteLocked" class="editor-chart-data-views-section__actions">
							<button
								type="button"
								class="editor-chart-data-views-section__action"
								:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_FRAME_ITEM_EDIT')"
								:data-test-id="$testId('dataViewsRowEdit', item.storageTypeId)"
								@click="onEdit(item)"
							>
								<BIcon :name="iconSet.EDIT_M" :size="20" aria-hidden="true"/>
							</button>
							<button
								type="button"
								class="editor-chart-data-views-section__action"
								:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_DELETE_CONFIRM_BUTTON')"
								:data-test-id="$testId('dataViewsRowDelete', item.storageTypeId)"
								@click="onDelete(item)"
							>
								<BIcon :name="iconSet.TRASHCAN" :size="20" aria-hidden="true"/>
							</button>
						</div>
					</div>
				</div>
			</div>
			<button
				v-if="!isWriteLocked"
				type="button"
				ref="createButton"
				class="editor-chart-data-views-section__add"
				:class="{ '--disabled': !canCreate }"
				:aria-disabled="!canCreate"
				:aria-label="createAriaLabel"
				v-hint="createHintOptions"
				:data-test-id="$testId('dataViewsCreate')"
				@click="onCreate"
			>
				<BIcon :name="iconSet.PLUS_M" :size="22" aria-hidden="true"/>
				<span>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_VIEWS_CREATE_BUTTON') }}</span>
			</button>
		</div>
	`,
};
