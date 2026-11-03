import { Loc, Runtime } from 'main.core';
import { defineComponent, markRaw } from 'ui.vue3';
import { mapGetters } from 'ui.vue3.vuex';
import type { DialogOptions, ItemOptions, TagSelector } from 'ui.entity-selector';
import type { AppParams, TableGroupItem } from '../types/state';
import { getTableGroupAvatar, TABLE_GROUP_AVATAR_OPTIONS, TABLE_GROUP_ENTITY_ID } from './table-group-item';
const TABLE_GROUP_TAB_ID = 'table-groups';

export const TableGroupField = defineComponent({
	name: 'BiconnectorDatasetImportV2TableGroupField',
	inject: ['appParams'],
	data(): { label: string, requiredMessage: string, selector: TagSelector | null }
	{
		return {
			label: Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_TABLE_GROUPS_LABEL') ?? '',
			requiredMessage: Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_TABLE_GROUPS') ?? '',
			// Assigned only through markRaw: a Vue proxy breaks private #field access of the selector
			selector: null,
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'tableGroupIds', 'hasPreview']),
		isVisible(): boolean
		{
			return !this.isEditMode && Boolean((this.appParams as AppParams)?.isTablePermissionsEnabled);
		},
		tableGroups(): Array<TableGroupItem>
		{
			return (this.appParams as AppParams)?.tableGroups ?? [];
		},
		// Marked the way the empty table code is: once the card is open and until a group is chosen
		isGroupMissing(): boolean
		{
			return this.isVisible && this.hasPreview && this.tableGroupIds.length === 0;
		},
	},
	async mounted(): Promise<void>
	{
		if (!this.isVisible)
		{
			return;
		}

		const { TagSelector: TagSelectorClass } = await Runtime.loadExtension('ui.entity-selector') as unknown as {
			TagSelector: typeof TagSelector,
		};
		this.initSelector(TagSelectorClass);
	},
	beforeUnmount(): void
	{
		// The card body is re-created whenever the preview is reset, so the dialog with the same id must go too
		this.selector?.getDialog()?.destroy();
		this.selector = null;
	},
	methods:
	{
		getSelectorItems(): Array<ItemOptions>
		{
			return this.tableGroups.map((group: TableGroupItem): ItemOptions => ({
				id: group.id,
				entityId: TABLE_GROUP_ENTITY_ID,
				title: group.name,
				avatar: getTableGroupAvatar(group),
				avatarOptions: TABLE_GROUP_AVATAR_OPTIONS,
				tabs: TABLE_GROUP_TAB_ID,
				selected: this.tableGroupIds.includes(group.id),
			}));
		},
		initSelector(TagSelectorClass: typeof TagSelector): void
		{
			const container = this.$refs.selector as HTMLElement | undefined;
			if (!container)
			{
				return;
			}

			const dialogOptions: Omit<DialogOptions, 'targetNode'> = {
				id: TABLE_GROUP_ENTITY_ID,
				items: this.getSelectorItems(),
				enableSearch: true,
				dropdownMode: true,
				popupOptions: {
					className: 'biconnector-dataset-entity-selector-popup',
				},
				showAvatars: true,
				multiple: true,
				width: 460,
				height: 320,
				tabs: [{
					id: TABLE_GROUP_TAB_ID,
					stubOptions: {
						title: Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_TABLE_GROUP_EMPTY_TITLE') ?? '',
					},
				}],
				entities: [{ id: TABLE_GROUP_ENTITY_ID }],
			};
			const selector = new TagSelectorClass({
				id: TABLE_GROUP_ENTITY_ID,
				multiple: true,
				addButtonCaption: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_SELECT') ?? '',
				addButtonCaptionMore: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_CHANGE') ?? '',
				// TagSelector sets the dialog targetNode itself
				dialogOptions: dialogOptions as DialogOptions,
				events: {
					onTagAdd: () => this.commitSelectedGroups(),
					onTagRemove: () => this.commitSelectedGroups(),
				},
			});
			selector.renderTo(container);

			this.selector = markRaw(selector);
		},
		commitSelectedGroups(): void
		{
			const ids = (this.selector as TagSelector).getTags().map((tag) => Number(tag.getId()));
			this.$store.commit('setTableGroupIds', ids);
		},
	},
	// language=Vue
	template: `
		<div
			v-if="isVisible"
			class="biconnector-dataset-import-v2-card__field"
			data-testid="biconnector-dataset-import-v2-table-group-field"
		>
			<span class="biconnector-dataset-import-v2-card__field-label">{{ label }}</span>
			<div
				ref="selector"
				:class="{ 'biconnector-dataset-import-v2-card__tag-selector--error': isGroupMissing }"
			/>
			<span v-if="isGroupMissing" class="biconnector-dataset-import-v2-card__field-error">
				{{ requiredMessage }}
			</span>
		</div>
	`,
});
