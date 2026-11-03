import { Loc, Type } from 'main.core';
import { BLine } from 'ui.system.skeleton.vue';
import { HeadlineSm, TextXs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { formatDate } from '../../lib/format-date/format-date';
import { formatSize } from '../../lib/format-size/format-size';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { type SelectionSnapshot } from '../../model/selection/types';
import { useSessionStore } from '../../model/session/session';
import { DiskIconView } from '../disk-icon/disk-icon';

import './preview-panel.css';

// The fan shows the tail of the selection, not its head: the card in front is the file just
// picked, so three is the depth at which the stack still reads as separate cards.
const FAN_LIMIT = 3;

type PreviewProp = {
	key: string,
	label: string,
	value: string,
};

// The span the given moments fall into, both ends through the product formatter. Equal ends
// collapse to a single date: "2 May - 2 May" states nothing the one date does not.
function formatDateRange(timestamps: Array<number | null>): string
{
	const known = timestamps.filter((value): value is number => value !== null);
	if (known.length === 0)
	{
		return '';
	}

	const from = formatDate(Math.min(...known));
	const to = formatDate(Math.max(...known));

	return from === to ? from : `${from} - ${to}`;
}

// Right column of the body. Three states with an explicit priority: several picked
// files -> fan of thumbnails, count and total size, all of it read from the picking
// snapshots and therefore true in a feed that lists none of them; a single active
// file of the visible list -> its thumbnail or a large type icon, name and a property
// table; neither -> hint. The composition is extensible: supporting a preview for a
// new type does not require rebuilding the layout.
export const PreviewPanel = defineComponent({
	name: 'DiskPickerPreviewPanel',
	components: {
		BDiskIcon: DiskIconView,
		BLine,
		HeadlineSm,
		TextXs,
	},
	data(): { loadedPreviewUrl: string | null }
	{
		return { loadedPreviewUrl: null };
	},
	watch: {
		// A new file means a new picture: the placeholder comes back until that one is decoded.
		'activeItem.previewUrl': function(): void
		{
			this.loadedPreviewUrl = null;
		},
	},
	computed: {
		// The url the browser has finished with, compared against the one on screen: a flag alone
		// would leave the placeholder off for a picture that has not arrived yet.
		previewImageLoaded(): boolean
		{
			return this.loadedPreviewUrl !== null && this.loadedPreviewUrl === this.activeItem?.previewUrl;
		},
		// getById returns null when the active id is not in the visible list; the panel
		// then falls back to the set summary or, with nothing to summarize, to the hint.
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
		// The whole set as it was at the moment of picking: the panel describes it from the
		// snapshots and never resolves picked ids through the visible list.
		selectedSnapshots(): SelectionSnapshot[]
		{
			return useSelectionStore().selectedSnapshotList;
		},
		showEmpty(): boolean
		{
			return !this.showMulti && this.activeItem === null;
		},
		showMulti(): boolean
		{
			return this.count > 1;
		},
		showSingle(): boolean
		{
			return !this.showMulti && this.activeItem !== null;
		},
		previewImageAllowed(): boolean
		{
			return !useSessionStore().navigationPending;
		},
		// A thumbnail is shown only once the picture is there and the list has settled;
		// otherwise the panel falls back to the format icon.
		showsPreviewImage(): boolean
		{
			return Type.isStringFilled(this.activeItem?.previewUrl) && this.previewImageAllowed;
		},
		// The last picked files, in the order they were picked: the template paints them in
		// sequence, so the newest lands on top of the stack without a z-index of its own.
		fanItems(): SelectionSnapshot[]
		{
			return this.selectedSnapshots.slice(-FAN_LIMIT);
		},
		// What the file is, under its name: the extension as the disk stores it, in capitals.
		// A file without one — a folder never reaches this panel — leaves the line out rather
		// than showing an empty label.
		formatLabel(): string
		{
			const extension = this.activeItem?.extension ?? null;

			return extension ? extension.toUpperCase() : '';
		},
		multiTitle(): string
		{
			return this.loc('DISK_PICKER_PREVIEW_MULTI_TITLE', { '#COUNT#': String(this.count) });
		},
		multiSize(): string
		{
			const total = this.selectedSnapshots.reduce((sum, snapshot) => sum + (snapshot.size ?? 0), 0);

			return formatSize(total);
		},
		// The selection is described by spans rather than by one date: the files were created
		// and changed at different moments, and the panel states the range they fall into.
		multiProps(): PreviewProp[]
		{
			return [
				{ key: 'size', label: this.loc('DISK_PICKER_PREVIEW_PROP_SIZE'), value: this.multiSize },
				{
					key: 'created',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_CREATED'),
					value: formatDateRange(this.selectedSnapshots.map((snapshot) => snapshot.createTime)),
				},
				{
					key: 'changed',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_CHANGED'),
					value: formatDateRange(this.selectedSnapshots.map((snapshot) => snapshot.updateTime)),
				},
			].filter((prop) => prop.value !== '');
		},
		// The properties come in two groups, separated in the panel by a divider: what the
		// file is, and where it came from. They are separate lists rather than one flagged
		// list because the template renders each group as its own block.
		fileProps(): PreviewProp[]
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
			];
		},
		originProps(): PreviewProp[]
		{
			const item = this.activeItem;
			if (item === null)
			{
				return [];
			}

			return [
				{ key: 'source', label: this.loc('DISK_PICKER_PREVIEW_PROP_SOURCE'), value: item.sourceTitle },
			];
		},
	},
	methods: {
		handlePreviewLoad(): void
		{
			this.loadedPreviewUrl = this.activeItem?.previewUrl ?? null;
		},
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
					<TextXs class="disk-picker-preview-panel__empty-hint-text">{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT') }}</TextXs>
				</div>
			</div>

			<div v-else-if="showMulti" :key="'multi'" class="disk-picker-preview-panel__multi" data-testid="universal-disk-picker-preview-multi">
				<div class="disk-picker-preview-panel__fan">
					<div
						v-for="snapshot in fanItems"
						:key="snapshot.objectId"
						class="disk-picker-preview-panel__fan-thumb"
					>
						<BDiskIcon
							:type="snapshot.iconType"
							:size="138"
							:preview-url="snapshot.previewUrl"
							keep-preview-on-feed-change
						/>
					</div>
				</div>
				<HeadlineSm accent class="disk-picker-preview-panel__multi-title">{{ multiTitle }}</HeadlineSm>
				<div class="disk-picker-preview-panel__props">
					<div
						v-for="prop in multiProps"
						:key="prop.key"
						class="disk-picker-preview-panel__prop"
					>
						<TextXs class="disk-picker-preview-panel__prop-label">{{ prop.label }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ prop.value }}</TextXs>
					</div>
				</div>
			</div>

			<div v-else-if="showSingle" :key="'single-' + activeItem.objectId" class="disk-picker-preview-panel__single" data-testid="universal-disk-picker-preview-single">
				<div class="disk-picker-preview-panel__thumb">
					<div
						v-if="showsPreviewImage && !previewImageLoaded"
						class="disk-picker-preview-panel__thumb-skeleton"
						aria-hidden="true"
					>
						<BLine :height="154" :radius="12"/>
					</div>
					<img
						v-if="showsPreviewImage"
						v-show="previewImageLoaded"
						class="disk-picker-preview-panel__image"
						:src="activeItem.previewUrl"
						:alt="activeItem.name"
						@load="handlePreviewLoad"
						@error="handlePreviewLoad"
					/>
					<BDiskIcon
						v-else
						:key="activeItem.objectId"
						:type="activeItem.iconType"
						:size="128"
					/>
				</div>
				<div class="disk-picker-preview-panel__title">
					<HeadlineSm accent class="disk-picker-preview-panel__name">{{ activeItem.name }}</HeadlineSm>
					<TextXs
						v-if="formatLabel"
						class="disk-picker-preview-panel__format"
						data-testid="universal-disk-picker-preview-format"
					>{{ formatLabel }}</TextXs>
				</div>
				<div class="disk-picker-preview-panel__props">
					<div
						v-for="prop in fileProps"
						:key="prop.key"
						class="disk-picker-preview-panel__prop"
					>
						<TextXs class="disk-picker-preview-panel__prop-label">{{ prop.label }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ prop.value }}</TextXs>
					</div>
				</div>
				<div class="disk-picker-preview-panel__props --origin">
					<div
						v-for="prop in originProps"
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
