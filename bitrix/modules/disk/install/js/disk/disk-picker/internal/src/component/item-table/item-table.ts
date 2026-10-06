import { Loc } from 'main.core';
import { Text2Xs, TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { toggleSelection } from '../../feature/toggle-selection/toggle-selection';
import { formatTableDate } from '../../lib/format-date/format-date';
import { formatSize } from '../../lib/format-size/format-size';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { DiskIconView } from '../disk-icon/disk-icon';

import './item-table.css';

// The table view is a second projection of the same feed: the same items in rows
// with Name/Size/Added columns, spanning the whole work area with no preview
// panel. The selection and navigation logic is not duplicated here - every row
// delegates to the toggleSelection scenario, exactly like the list row. The event
// plumbing mirrors ItemRow because both are thin presentational shells over the
// same domain action.
export const ItemTable = defineComponent({
	name: 'DiskPickerItemTable',
	components: {
		BDiskIcon: DiskIconView,
		Text2Xs,
		TextSm,
	},
	props: {
		items: {
			type: Array,
			default: (): PickerItem[] => useItemStore().items,
		},
		topSpacerHeight: {
			type: Number,
			default: 0,
		},
		bottomSpacerHeight: {
			type: Number,
			default: 0,
		},
		focusObjectId: {
			type: Number,
			default: null,
		},
	},
	methods: {
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
		},
		isSelected(item: PickerItem): boolean
		{
			return useSelectionStore().selectedIdSet.has(item.objectId);
		},
		isActive(item: PickerItem): boolean
		{
			return useSelectionStore().activeObjectId === item.objectId;
		},
		isDisabled(item: PickerItem): boolean
		{
			return !item.isFolder && !item.selectable;
		},
		ariaPressed(item: PickerItem): boolean | null
		{
			return !item.isFolder && item.selectable ? this.isSelected(item) : null;
		},
		rowClass(item: PickerItem): { [key: string]: boolean }
		{
			return {
				'--selected': this.isSelected(item),
				'--active': this.isActive(item),
			};
		},
		testId(item: PickerItem): string
		{
			return `universal-disk-picker-file-row-${item.objectId}`;
		},
		// Folder size stays empty, not a zero.
		sizeText(item: PickerItem): string
		{
			return item.isFolder ? '' : formatSize(item.size);
		},
		addedText(item: PickerItem): string
		{
			return formatTableDate(item.createTime, this.loc('DISK_PICKER_TABLE_TODAY'));
		},
		activate(item: PickerItem, modifier: boolean): void
		{
			if (this.isDisabled(item))
			{
				return;
			}

			toggleSelection(item, modifier, useSessionStore().callbacks);
		},
		handleClick(item: PickerItem, event: MouseEvent): void
		{
			this.activate(item, event.metaKey || event.ctrlKey);
		},
		handleKeydown(item: PickerItem, event: KeyboardEvent): void
		{
			if (event.key === ' ' || event.key === 'Spacebar')
			{
				event.preventDefault();
				this.activate(item, true);
			}
		},
	},
	template: `
		<table class="disk-picker-item-table" data-testid="universal-disk-picker-table">
			<colgroup>
				<col class="--name">
				<col class="--size">
				<col class="--added">
			</colgroup>
			<thead>
				<tr class="disk-picker-item-table__head">
					<th scope="col" class="disk-picker-item-table__cell --name">
						<Text2Xs :accent="true">{{ loc('DISK_PICKER_TABLE_NAME') }}</Text2Xs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --size">
						<Text2Xs :accent="true">{{ loc('DISK_PICKER_TABLE_SIZE') }}</Text2Xs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --added">
						<Text2Xs :accent="true">{{ loc('DISK_PICKER_TABLE_ADDED') }}</Text2Xs>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="topSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: topSpacerHeight + 'px' }" colspan="3"></td>
				</tr>
				<tr
					v-for="item in items"
					:key="item.objectId"
					class="disk-picker-item-table__row"
					:class="rowClass(item)"
					:data-testid="testId(item)"
					@click="handleClick(item, $event)"
				>
					<td class="disk-picker-item-table__cell --name">
						<button
							type="button"
							class="disk-picker-item-table__action"
							:tabindex="item.objectId === focusObjectId ? 0 : -1"
							:aria-pressed="ariaPressed(item)"
							:aria-disabled="isDisabled(item) ? 'true' : null"
							:data-composite-id="item.objectId"
							@keydown="handleKeydown(item, $event)"
						>
							<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
							<TextSm class="disk-picker-item-table__name">{{ item.name }}</TextSm>
						</button>
					</td>
					<td class="disk-picker-item-table__cell --size"><TextSm>{{ sizeText(item) }}</TextSm></td>
					<td class="disk-picker-item-table__cell --added"><TextSm>{{ addedText(item) }}</TextSm></td>
				</tr>
				<tr v-if="bottomSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: bottomSpacerHeight + 'px' }" colspan="3"></td>
				</tr>
			</tbody>
		</table>
	`,
});
