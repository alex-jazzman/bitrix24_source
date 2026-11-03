import { Loc } from 'main.core';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { StageType } from '../../const/picker';
import { confirmItem } from '../../feature/confirm-selection/confirm-selection';
import {
	beginClick,
	openPreviewFromButton,
	openPreviewFromDblclick,
} from '../../feature/row-activation/row-activation';
import { toggleFileSelection } from '../../feature/toggle-selection/toggle-selection';
import { formatTableDate } from '../../lib/format-date/format-date';
import { formatSize } from '../../lib/format-size/format-size';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { DiskIconView } from '../disk-icon/disk-icon';
import { PreviewButton } from '../preview-button/preview-button';

import './item-table.css';

// The table view is a second projection of the same feed: the same items in rows
// with Name/Size/Date columns, spanning the whole work area with no preview
// panel. Selection, navigation and the click protocol are not duplicated here -
// every row delegates to the same scenarios the list row does. The name cell holds a
// native button; Enter and Space are handled explicitly on keydown, same as ItemRow, so
// Enter can confirm the selection instead of only toggling it.
//
// The preview column header is visually hidden text rather than aria-label: a header cell named
// only by aria-label reads as empty to an audit. On a picked row the eye takes the edge-dark
// token context, same as the list row.
export const ItemTable = defineComponent({
	name: 'DiskPickerItemTable',
	components: {
		BDiskIcon: DiskIconView,
		PreviewButton,
		TextMd,
		TextXs,
	},
	// `<visually-hidden>` is the custom element of ui.a11y (a dependency of the extension),
	// so it is an element to render and not a component to look up.
	compilerOptions: {
		isCustomElement: (tag: string): boolean => tag === 'visually-hidden',
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
		dateColumnLabel(): string
		{
			return this.loc(
				useSessionStore().stageType === StageType.Recent
					? 'DISK_PICKER_TABLE_CHANGED'
					: 'DISK_PICKER_TABLE_ADDED',
			);
		},
		dateText(item: PickerItem): string
		{
			const timestamp = useSessionStore().stageType === StageType.Recent
				? item.updateTime
				: item.createTime;

			return formatTableDate(timestamp, this.loc('DISK_PICKER_TABLE_TODAY'));
		},
		handleClick(item: PickerItem, event: MouseEvent): void
		{
			beginClick(item, event);
		},
		// The preview starts from the name button of the row - the only focusable element a
		// row has - so closing the viewer brings the focus back onto the row.
		handleDblclick(item: PickerItem, event: MouseEvent): void
		{
			const row = event.currentTarget as HTMLElement;
			const initiator = row.querySelector<HTMLElement>('.disk-picker-item-table__action') ?? row;

			openPreviewFromDblclick(item, initiator, this.windowContainer());
		},
		handlePreviewOpen(item: PickerItem, initiator: HTMLElement | null): void
		{
			openPreviewFromButton(item, initiator, this.windowContainer());
		},
		// The window the viewer shows itself over is the picker popup around this table; a
		// table mounted on its own (a unit test) has none, and the scenario falls back to
		// the page.
		windowContainer(): HTMLElement | null
		{
			return (this.$el as HTMLElement).closest<HTMLElement>('.disk-picker');
		},
		// Same keyboard contract as the list row, see ItemRow.handleKeydown.
		handleKeydown(item: PickerItem, event: KeyboardEvent): void
		{
			if (event.key === ' ' || event.key === 'Spacebar')
			{
				event.preventDefault();
				toggleFileSelection(item, useSessionStore().callbacks);
			}
			else if (event.key === 'Enter')
			{
				event.preventDefault();
				void confirmItem(item, useSessionStore().callbacks);
			}
		},
	},
	template: `
		<table class="disk-picker-item-table" data-testid="universal-disk-picker-table">
			<colgroup>
				<col class="--name">
				<col class="--size">
				<col class="--added">
				<col class="--preview">
			</colgroup>
			<thead>
				<tr class="disk-picker-item-table__head">
					<th scope="col" class="disk-picker-item-table__cell --name">
						<TextXs class="disk-picker-item-table__head-label">{{ loc('DISK_PICKER_TABLE_NAME') }}</TextXs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --size">
						<TextXs class="disk-picker-item-table__head-label">{{ loc('DISK_PICKER_TABLE_SIZE') }}</TextXs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --added">
						<TextXs class="disk-picker-item-table__head-label">{{ dateColumnLabel() }}</TextXs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --preview">
						<visually-hidden>{{ loc('DISK_PICKER_PREVIEW_OPEN') }}</visually-hidden>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="topSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: topSpacerHeight + 'px' }" colspan="4"></td>
				</tr>
				<tr
					v-for="item in items"
					:key="item.objectId"
					class="disk-picker-item-table__row"
					:class="rowClass(item)"
					:data-testid="testId(item)"
					@click="handleClick(item, $event)"
					@dblclick="handleDblclick(item, $event)"
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
							<TextMd class="disk-picker-item-table__name">{{ item.name }}</TextMd>
						</button>
					</td>
					<td class="disk-picker-item-table__cell --size">
						<TextMd class="disk-picker-item-table__value">{{ sizeText(item) }}</TextMd>
					</td>
					<td class="disk-picker-item-table__cell --added">
						<TextMd class="disk-picker-item-table__value">{{ dateText(item) }}</TextMd>
					</td>
					<td class="disk-picker-item-table__cell --preview">
						<PreviewButton
							:item="item"
							:tab-index="item.objectId === focusObjectId ? 0 : -1"
							:class="{ '--ui-context-edge-dark': isSelected(item), '--air-context-blurred-bg': isSelected(item) }"
							:on-accent="isSelected(item)"
							@open="handlePreviewOpen(item, $event)"
						/>
					</td>
				</tr>
				<tr v-if="bottomSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: bottomSpacerHeight + 'px' }" colspan="4"></td>
				</tr>
			</tbody>
		</table>
	`,
});
