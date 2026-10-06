import { TextSm } from 'ui.system.typography.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { toggleSelection } from '../../feature/toggle-selection/toggle-selection';
import { type PickerItem } from '../../model/item/types';
import { useSessionStore } from '../../model/session/session';
import { DiskIconView } from '../disk-icon/disk-icon';

import './item-row.css';

// A single output row: icon or thumbnail plus the object name. The row owns its
// own click and keyboard interaction and delegates to the selection feature; it
// never touches the network or decides folder navigation on its own.
export const ItemRow = defineComponent({
	name: 'DiskPickerItemRow',
	components: {
		BDiskIcon: DiskIconView,
		TextSm,
	},
	props: {
		item: {
			type: Object as PropType<PickerItem>,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
		tabIndex: {
			type: Number,
			default: -1,
		},
	},
	computed: {
		disabled(): boolean
		{
			return !this.item.isFolder && !this.item.selectable;
		},
		ariaPressed(): boolean | null
		{
			return !this.item.isFolder && this.item.selectable ? this.selected : null;
		},
		rowClass(): { [key: string]: boolean }
		{
			return {
				'--selected': this.selected,
				'--active': this.active,
			};
		},
		testId(): string
		{
			return `universal-disk-picker-file-row-${this.item.objectId}`;
		},
	},
	methods: {
		activate(modifier: boolean): void
		{
			if (this.disabled)
			{
				return;
			}

			toggleSelection(this.item, modifier, useSessionStore().callbacks);
		},
		handleClick(event: MouseEvent): void
		{
			this.activate(event.metaKey || event.ctrlKey);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === ' ' || event.key === 'Spacebar')
			{
				// Space carries the modifier semantics (add/remove in multiple); in
				// single the feature replaces regardless.
				event.preventDefault();
				this.activate(true);
			}
		},
	},
	template: `
		<button
			type="button"
			class="disk-picker-item-row"
			:class="rowClass"
			:tabindex="tabIndex"
			:aria-pressed="ariaPressed"
			:aria-disabled="disabled ? 'true' : null"
			:data-composite-id="item.objectId"
			:data-testid="testId"
			@click="handleClick"
			@keydown="handleKeydown"
		>
			<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
			<TextSm class="disk-picker-item-row__name">{{ item.name }}</TextSm>
		</button>
	`,
});
