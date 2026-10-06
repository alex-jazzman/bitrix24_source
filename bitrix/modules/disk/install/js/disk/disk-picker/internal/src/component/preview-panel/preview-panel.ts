import { Browser, Loc } from 'main.core';
import { TextSm, TextXs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { SelectionMode } from '../../const/picker';
import { formatDate } from '../../lib/format-date/format-date';
import { formatSize } from '../../lib/format-size/format-size';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { DiskIconView } from '../disk-icon/disk-icon';

import './preview-panel.css';

const FAN_LIMIT = 5;

type PreviewProp = {
	key: string,
	label: string,
	value: string,
};

// Right column of the body. Three states with an explicit priority: no active
// file in the visible list -> hint; active visible with several files selected ->
// fan of thumbnails, count and total size; otherwise the active file -> its
// thumbnail or a large type icon, name and a property table. The composition is
// extensible: supporting a preview for a new type does not require rebuilding the
// layout. The absence of an active file wins over a multi selection.
export const PreviewPanel = defineComponent({
	name: 'DiskPickerPreviewPanel',
	components: {
		BDiskIcon: DiskIconView,
		TextSm,
		TextXs,
	},
	computed: {
		// getById returns null when the active id is not in the visible list, which
		// is exactly the empty-state trigger.
		activeItem(): PickerItem | null
		{
			const activeObjectId = useSelectionStore().activeObjectId;
			if (activeObjectId === null)
			{
				return null;
			}

			return useItemStore().getById(activeObjectId);
		},
		count(): number
		{
			return useSelectionStore().count;
		},
		isMultipleMode(): boolean
		{
			return useSessionStore().constraints.selectionMode === SelectionMode.Multiple;
		},
		multiSelectShortcut(): string
		{
			return Browser.isMac() ? 'Cmd' : 'Ctrl';
		},
		// Only visible selected files: the fan is never built from hidden ids.
		selectedItems(): PickerItem[]
		{
			const item = useItemStore();

			return useSelectionStore().selectedIds
				.map((objectId) => item.getById(objectId))
				.filter((entry): entry is PickerItem => entry !== null);
		},
		showEmpty(): boolean
		{
			return this.activeItem === null;
		},
		showMulti(): boolean
		{
			return this.activeItem !== null && this.count > 1;
		},
		showSingle(): boolean
		{
			return this.activeItem !== null && this.count <= 1;
		},
		fanItems(): PickerItem[]
		{
			return this.selectedItems.slice(0, FAN_LIMIT);
		},
		multiTitle(): string
		{
			return this.loc('DISK_PICKER_PREVIEW_MULTI_TITLE', { '#COUNT#': String(this.count) });
		},
		multiSize(): string
		{
			const selection = useSelectionStore();
			const item = useItemStore();
			const total = selection.selectedIds.reduce((sum, objectId) => {
				return sum + (selection.selectedSizes[objectId] ?? item.getById(objectId)?.size ?? 0);
			}, 0);

			return formatSize(total);
		},
		singleProps(): PreviewProp[]
		{
			const item = this.activeItem;
			if (item === null)
			{
				return [];
			}

			return [
				{ key: 'size', label: this.loc('DISK_PICKER_PREVIEW_PROP_SIZE'), value: formatSize(item.size) },
				{ key: 'created', label: this.loc('DISK_PICKER_PREVIEW_PROP_CREATED'), value: formatDate(item.createTime) },
				{ key: 'changed', label: this.loc('DISK_PICKER_PREVIEW_PROP_CHANGED'), value: formatDate(item.updateTime) },
				{ key: 'source', label: this.loc('DISK_PICKER_PREVIEW_PROP_SOURCE'), value: item.sourceTitle },
			];
		},
	},
	methods: {
		loc(messageCode: string, replacements?: { [key: string]: string }): string
		{
			return Loc.getMessage(messageCode, replacements) ?? '';
		},
	},
	template: `
		<div class="disk-picker-preview-panel" data-testid="universal-disk-picker-preview-pane">
			<div v-if="showEmpty" class="disk-picker-preview-panel__empty" data-testid="universal-disk-picker-preview-empty">
				<div
					class="disk-picker-preview-panel__empty-graphic"
					data-testid="universal-disk-picker-preview-empty-graphic"
					aria-hidden="true"
				></div>
				<div class="disk-picker-preview-panel__empty-hint">
					<TextXs>{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT') }}</TextXs>
					<TextXs
						v-if="isMultipleMode"
						class="disk-picker-preview-panel__multi-hint"
						data-testid="universal-disk-picker-preview-empty-shortcut"
					>
						<span>{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT_MULTI') }}</span>
						<span class="disk-picker-preview-panel__multi-hint-action">
							<span>{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT_MULTI_ACTION') }}</span>
							<kbd>{{ multiSelectShortcut }}</kbd>
							<span aria-hidden="true">+</span>
							<span
								class="disk-picker-preview-panel__click"
								data-testid="universal-disk-picker-preview-empty-click"
								role="img"
								:aria-label="loc('DISK_PICKER_PREVIEW_MOUSE_CLICK_ARIA')"
							></span>
						</span>
					</TextXs>
				</div>
			</div>

			<div v-else-if="showMulti" class="disk-picker-preview-panel__multi" data-testid="universal-disk-picker-preview-multi">
				<div class="disk-picker-preview-panel__fan">
					<div
						v-for="item in fanItems"
						:key="item.objectId"
						class="disk-picker-preview-panel__fan-thumb"
					>
						<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
					</div>
				</div>
				<TextSm class="disk-picker-preview-panel__multi-title">{{ multiTitle }}</TextSm>
				<div class="disk-picker-preview-panel__props">
					<div class="disk-picker-preview-panel__prop">
						<TextXs class="disk-picker-preview-panel__prop-label">{{ loc('DISK_PICKER_PREVIEW_PROP_SIZE') }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ multiSize }}</TextXs>
					</div>
				</div>
			</div>

			<div v-else-if="showSingle" class="disk-picker-preview-panel__single" data-testid="universal-disk-picker-preview-single">
				<div class="disk-picker-preview-panel__thumb">
					<img
						v-if="activeItem.previewUrl"
						class="disk-picker-preview-panel__image"
						:src="activeItem.previewUrl"
						:alt="activeItem.name"
					/>
					<BDiskIcon v-else :type="activeItem.iconType" :size="64"/>
				</div>
				<TextSm class="disk-picker-preview-panel__name">{{ activeItem.name }}</TextSm>
				<div class="disk-picker-preview-panel__props">
					<div
						v-for="prop in singleProps"
						:key="prop.key"
						class="disk-picker-preview-panel__prop"
					>
						<TextXs class="disk-picker-preview-panel__prop-label">{{ prop.label }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ prop.value }}</TextXs>
					</div>
				</div>
			</div>
		</div>
	`,
});
