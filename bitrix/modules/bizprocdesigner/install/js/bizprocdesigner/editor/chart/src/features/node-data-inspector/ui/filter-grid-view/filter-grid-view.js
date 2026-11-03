import { Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Dialog, type Item } from 'ui.entity-selector';
import 'ui.system.input';
import { mapState, mapActions } from 'ui.vue3.pinia';

import { useLoc } from '../../../../shared/composables';
import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';

import { type InspectorViewItemBase } from '../../../../entities/node-data-inspector';

import './filter-grid-view.css';

const NodeEntityId = 'bizproc-node';

// a select-only combobox holds a listbox until the dialog turns its list of items into a tree
const DefaultPopupRole = 'listbox';

// encodeURIComponent escapes both separators below, so a joined path stays unambiguous
// whatever an item id or title holds
const DialogItemIdSeparator = '/';
const DialogItemIdOrdinalSeparator = ':';

function isGroupItem(item: InspectorViewItemBase): boolean
{
	return Type.isArrayFilled(item?.items);
}

function getDialogItemSegment(item: InspectorViewItemBase): string
{
	return encodeURIComponent(Type.isStringFilled(item.id) ? item.id : item.text);
}

function getDialogItemId(parentItemId: string, segment: string, occurrence: number): string
{
	const uniqueSegment = occurrence === 1
		? segment
		: `${segment}${DialogItemIdOrdinalSeparator}${occurrence}`
	;

	return parentItemId === '' ? uniqueSegment : `${parentItemId}${DialogItemIdSeparator}${uniqueSegment}`;
}

// deepest branch first, so the group selected by default is the one the panel selected before:
// the group of the first branch, not the top level container it lies in
function flattenDialogItems(items: Array<Item>, flattened: Array<Item> = []): Array<Item>
{
	items.forEach((item) => {
		flattenDialogItems(item.children ?? [], flattened);
		flattened.push(item);
	});

	return flattened;
}

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

		return { getMessage };
	},
	data(): Object
	{
		return {
			isDialogOpen: false,
			popupRole: DefaultPopupRole,
			popupListBoxId: null,
		};
	},
	computed:
	{
		...mapState(useNodeDataInspectorStore, ['selectedGridViewGroup']),
		dropdownValue(): string
		{
			return this.selectedGridViewGroup?.title ?? '';
		},
		// the accessible name of the field is its visible text, so the placeholder serves as both
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
				this.dialogItems = this.getDialogItems(this.templateData.groups);
				this.syncSelectedGridViewGroup();
			},
			immediate: true,
		},
	},
	beforeUnmount(): void
	{
		this.destroyDialog();
	},
	methods:
	{
		...mapActions(useNodeDataInspectorStore, ['selectGridViewGroup', 'resetGridView']),
		getDialogItems(items: Array<InspectorViewItemBase>, parentItemId: string = ''): Array<Item>
		{
			const segmentOccurrences = new Map();

			return items.filter(isGroupItem).map((item) => {
				const segment = getDialogItemSegment(item);
				// a repeated segment gets an ordinal, so same-named siblings never share a dialog row
				const occurrence = (segmentOccurrences.get(segment) ?? 0) + 1;
				segmentOccurrences.set(segment, occurrence);

				const id = getDialogItemId(parentItemId, segment, occurrence);
				const dialogItem = {
					id,
					entityId: NodeEntityId,
					title: item.text,
					tabs: 'recents',
					customData: {
						values: item.items,
					},
				};

				const children = this.getDialogItems(item.items, id);
				if (children.length > 0)
				{
					dialogItem.children = children;
				}

				return dialogItem;
			});
		},
		syncSelectedGridViewGroup(): void
		{
			const dialogItems = flattenDialogItems(this.dialogItems);
			const selectedId = this.selectedGridViewGroup?.id;
			// the group chosen by the user survives a rebuild of the tree; a group gone from the
			// rebuilt tree gives its place back to the group the panel selects by default
			const item = dialogItems.find((dialogItem) => dialogItem.id === selectedId) ?? dialogItems[0];

			if (!item)
			{
				this.resetGridView();

				return;
			}

			this.selectGridViewGroup({
				id: item.id,
				title: item.title,
				values: item.customData.values,
			});
		},
		openDialog(): void
		{
			// a dialog left over from a previous open would report its own closing over the new one
			this.destroyDialog();

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
					onShow: this.handleDialogShow,
					onHide: this.handleDialogHide,
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

			this.dialog = dialog;
			dialog.show();
			// onShow waits for the opening animation of the popup, so the state of the field is set here
			this.isDialogOpen = true;

			const items = dialog.getItems();
			const selectedItem = items.find((item) => item.id === this.selectedGridViewGroup?.id);
			selectedItem?.select(true);
		},
		handleDialogShow(): void
		{
			// the list of the popup owns its own id and role, so the field reads them instead of guessing
			const listBox = this.dialog?.getActiveTab()?.getListBoxContainer();

			this.popupListBoxId = Type.isStringFilled(listBox?.id) ? listBox.id : null;
			this.popupRole = listBox?.getAttribute('role') ?? DefaultPopupRole;
		},
		handleDialogHide(): void
		{
			this.forgetDialog();
		},
		destroyDialog(): void
		{
			this.dialog?.destroy();
			this.forgetDialog();
		},
		// a closed dropdown popup destroys the dialog behind it, and its list leaves the document with it
		forgetDialog(): void
		{
			this.dialog = null;
			this.isDialogOpen = false;
			this.popupListBoxId = null;
		},
	},
	template: `
		<div
			class="ui-system-input-container editor-chart-filter-grid-view-dropdown"
			ref="filterGridDropdown"
			:data-test-id="$testId('nodeDataInspectorGridGroupFilter')"
			@click="openDialog"
		>
			<input
				class="ui-system-input-value"
				type="text"
				readonly
				role="combobox"
				:aria-label="placeholderText"
				:aria-expanded="isDialogOpen ? 'true' : 'false'"
				:aria-haspopup="popupRole"
				:aria-controls="popupListBoxId"
				:placeholder="placeholderText"
				:value="dropdownValue"
				:title="dropdownValue"
				:data-test-id="$testId('nodeDataInspectorGridGroupFilterValue')"
				@keydown.enter.prevent="openDialog"
				@keydown.space.prevent="openDialog"
			/>
			<div class="ui-icon-set --chevron-down-l ui-system-input-dropdown"></div>
		</div>
	`,
};
