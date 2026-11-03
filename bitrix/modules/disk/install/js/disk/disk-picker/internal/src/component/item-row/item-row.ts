import { TextMd } from 'ui.system.typography.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { confirmItem } from '../../feature/confirm-selection/confirm-selection';
import {
	beginClick,
	openPreviewFromButton,
	openPreviewFromDblclick,
} from '../../feature/row-activation/row-activation';
import { toggleFileSelection } from '../../feature/toggle-selection/toggle-selection';
import { type PickerItem } from '../../model/item/types';
import { useSessionStore } from '../../model/session/session';
import { DiskIconView } from '../disk-icon/disk-icon';
import { PreviewButton } from '../preview-button/preview-button';

import './item-row.css';

// A single output row: icon or thumbnail plus the object name. The row is a native button;
// Enter and Space are handled explicitly on keydown so Enter can confirm the selection
// instead of only toggling it. A button takes no button inside it, so the preview eye is a
// sibling under the wrapper, sharing the row's roving tab index.
//
// The icon size 24 mirrors --ui-size-xl: DiskIcon takes a number, so the token cannot be used.
// On a picked row the eye stands on the accent fill, where the neutral content colour of the
// button would grey out, so it takes the edge-dark token context and repaints itself light;
// the blurred-bg context keeps the theme wallpaper that edge context brings off the button.
export const ItemRow = defineComponent({
	name: 'DiskPickerItemRow',
	components: {
		BDiskIcon: DiskIconView,
		PreviewButton,
		TextMd,
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
		handleClick(event: MouseEvent): void
		{
			beginClick(this.item, event);
		},
		// The preview starts from the row itself, so closing the viewer brings the focus
		// back to it.
		handleDblclick(event: MouseEvent): void
		{
			openPreviewFromDblclick(this.item, event.currentTarget as HTMLElement, this.windowContainer());
		},
		handlePreviewOpen(initiator: HTMLElement | null): void
		{
			openPreviewFromButton(this.item, initiator, this.windowContainer());
		},
		// The window the viewer shows itself over is the picker popup around this row; a row
		// mounted on its own (a unit test, the showcase page) has none, and the scenario
		// falls back to the page.
		windowContainer(): HTMLElement | null
		{
			return (this.$el as HTMLElement).closest<HTMLElement>('.disk-picker');
		},
		// The native button would otherwise turn both Space and Enter into a plain click;
		// handled here on keydown so Enter can confirm the selection instead of only toggling it.
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === ' ' || event.key === 'Spacebar')
			{
				event.preventDefault();
				toggleFileSelection(this.item, useSessionStore().callbacks);
			}
			else if (event.key === 'Enter')
			{
				event.preventDefault();
				void confirmItem(this.item, useSessionStore().callbacks);
			}
		},
	},
	template: `
		<div class="disk-picker-item-row-wrap" :class="rowClass">
			<button
				type="button"
				class="disk-picker-item-row"
				:tabindex="tabIndex"
				:aria-pressed="ariaPressed"
				:aria-disabled="disabled ? 'true' : null"
				:data-composite-id="item.objectId"
				:data-testid="testId"
				@click="handleClick"
				@dblclick="handleDblclick"
				@keydown="handleKeydown"
			>
				<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
				<TextMd class="disk-picker-item-row__name">{{ item.name }}</TextMd>
			</button>
			<PreviewButton
				:item="item"
				:tab-index="tabIndex"
				:class="{ '--ui-context-edge-dark': selected, '--air-context-blurred-bg': selected }"
				:on-accent="selected"
				@open="handlePreviewOpen"
			/>
		</div>
	`,
});
