import { Loc, Runtime } from 'main.core';
import { defineComponent } from 'ui.vue3';
import { mapGetters } from 'ui.vue3.vuex';
import type { TagSelector, TagSelectorOptions } from 'ui.entity-selector';
import type { DatasetProperties, TableGroupItem } from '../types/state';
import { getTableGroupAvatar, TABLE_GROUP_AVATAR_OPTIONS, TABLE_GROUP_ENTITY_ID } from './table-group-item';

type TagOptions = NonNullable<TagSelectorOptions['items']>[number];

/**
 * Groups of an existing or a system table, shown without a way to change them: the group is chosen only on creation.
 */
export const TableGroupView = defineComponent({
	name: 'BiconnectorDatasetImportV2TableGroupView',
	data(): { label: string }
	{
		return {
			label: Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_TABLE_GROUPS_LABEL') ?? '',
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'isSystem', 'datasetProperties']),
		tableGroups(): Array<TableGroupItem>
		{
			return (this.datasetProperties as DatasetProperties)?.tableGroups ?? [];
		},
		isVisible(): boolean
		{
			return (this.isEditMode || this.isSystem) && this.tableGroups.length > 0;
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
	methods:
	{
		getTags(): Array<TagOptions>
		{
			return this.tableGroups.map((group: TableGroupItem): TagOptions => ({
				id: group.id,
				entityId: TABLE_GROUP_ENTITY_ID,
				title: group.name,
				avatar: getTableGroupAvatar(group),
				avatarOptions: TABLE_GROUP_AVATAR_OPTIONS,
			}));
		},
		initSelector(TagSelectorClass: typeof TagSelector): void
		{
			const container = this.$refs.selector as HTMLElement | undefined;
			if (!container)
			{
				return;
			}

			const selector = new TagSelectorClass({
				multiple: true,
				readonly: true,
				items: this.getTags(),
			});
			selector.renderTo(container);
		},
	},
	// language=Vue
	template: `
		<div
			v-if="isVisible"
			class="biconnector-dataset-import-v2-card__field"
			data-testid="biconnector-dataset-import-v2-table-group-view"
		>
			<span class="biconnector-dataset-import-v2-card__field-label">{{ label }}</span>
			<div ref="selector"/>
		</div>
	`,
});
