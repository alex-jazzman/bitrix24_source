import { type BaseEvent } from 'main.core.events';
import { Dialog, type Item } from 'ui.entity-selector';
import 'ui.system.input';
import { mapState, mapActions } from 'ui.vue3.pinia';

import { useLoc } from '../../../../shared/composables';
import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';

import { type InspectorViewItemBase } from '../../../../entities/node-data-inspector';

import './filter-grid-view.css';

const NodeEntityId = 'bizproc-node';

// @vue/component
export const FilterGridView = {
	name: 'FilterGridView',
	props:
	{
		/** @type { groups: Array<InspectorViewItemBase> } */
		templateData:
		{
			type: Object,
			required: true,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();
		const dialogItemId = 0;

		return {
			getMessage,
			dialogItemId,
		};
	},
	computed:
	{
		...mapState(useNodeDataInspectorStore, ['selectedGridViewGroup']),
		dropdownValue(): string
		{
			return this.selectedGridViewGroup?.title ?? '';
		},
		placeholderText(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PLACEHOLDER');
		},
	},
	watch:
	{
		templateData:
		{
			handler(): void
			{
				this.resetGridView();
				this.dialogItemId = 0;
				this.dialogItems = this.getDialogItems(this.templateData.groups);
			},
			immediate: true,
		},
	},
	methods:
	{
		...mapActions(useNodeDataInspectorStore, ['selectGridViewGroup', 'resetGridView']),
		getDialogItems(items: Array<InspectorViewItemBase>): Array<Item>
		{
			return items.map(({ id, text, items: children, type }) => {
				const dialogItem = {
					id: ++this.dialogItemId,
					entityId: NodeEntityId,
					title: text,
					tabs: 'recents',
					customData: {
						values: children,
					},
				};

				const hasChildren = children?.some((child) => Boolean(child.items));
				if (hasChildren)
				{
					dialogItem.children = this.getDialogItems(children);
				}

				if (!this.selectedGridViewGroup)
				{
					this.selectGridViewGroup({
						id: dialogItem.id,
						title: dialogItem.title,
						values: children,
					});
				}

				return dialogItem;
			});
		},
		openDialog(): void
		{
			const dialog = new Dialog({
				targetNode: this.$refs.filterGridDropdown,
				width: 400,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				cacheable: false,
				showAvatars: false,
				items: this.dialogItems,
				events: {
					'Item:onSelect': (event: BaseEvent): void => {
						const item = event.getData().item;
						const customData = item.getCustomData();
						this.selectGridViewGroup({
							id: item.id,
							title: item.title,
							values: customData.get('values'),
						});
					},
					'Item:onDeselect': () => {
						this.resetGridView();
					},
				},
			});
			dialog.show();
			const items = dialog.getItems();
			const selectedItem = items.find((item) => item.id === this.selectedGridViewGroup?.id);
			selectedItem?.select(true);
		},
	},
	template: `
		<div
			class="ui-system-input-container editor-chart-filter-grid-view-dropdown"
			ref="filterGridDropdown"
			@click="openDialog"
		>
			<input
				class="ui-system-input-value"
				type="text"
				readonly
				:placeholder="placeholderText"
				:value="dropdownValue"
				:title="dropdownValue"
			/>
			<div class="ui-icon-set --chevron-down-l ui-system-input-dropdown"></div>
		</div>
	`,
};
