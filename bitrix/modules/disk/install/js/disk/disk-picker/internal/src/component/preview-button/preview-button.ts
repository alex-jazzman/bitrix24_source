import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { defineComponent, type PropType } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { type PickerItem } from '../../model/item/types';

import './preview-button.css';

const LABEL_MESSAGE = 'DISK_PICKER_PREVIEW_OPEN';

// UiButton renders outside the Vue tree, so bound attributes never reach it: the accessible
// name and the roving tabindex are written onto the rendered element, and the hint is the
// native title of the wrapper.
export const PreviewButton = defineComponent({
	name: 'DiskPickerPreviewButton',
	components: {
		UiButton,
	},
	props: {
		item: {
			type: Object as PropType<PickerItem>,
			required: true,
		},
		tabIndex: {
			type: Number,
			default: -1,
		},
		// Set by a picked row: on the accent fill the no-accent glyph (white at seven tenths
		// in the edge context) falls under 3:1, and the plain style paints it full white.
		onAccent: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['open'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize, Outline };
	},
	computed: {
		label(): string
		{
			return Loc.getMessage(LABEL_MESSAGE) ?? '';
		},
		buttonTestId(): string
		{
			return `universal-disk-picker-preview-btn-${this.item.objectId}`;
		},
	},
	watch: {
		// The template does not read the tab index, so a roving change re-renders nothing
		// and `updated` never runs: the new value is written here.
		tabIndex(): void
		{
			this.syncButton();
		},
	},
	mounted(): void
	{
		this.syncButton();
	},
	// A re-render brings the button back without the attributes written below.
	updated(): void
	{
		this.syncButton();
	},
	methods: {
		buttonNode(): HTMLElement | null
		{
			const root = this.$el;

			return root instanceof HTMLElement ? root.querySelector('button') : null;
		},
		// On the next tick: until UiButton renders over its own placeholder, the placeholder
		// is what is found inside the wrapper.
		syncButton(): void
		{
			void this.$nextTick(() => {
				const button = this.buttonNode();
				if (button === null)
				{
					return;
				}

				button.tabIndex = this.tabIndex;
				button.setAttribute('aria-label', this.label);
			});
		},
		handleOpen(): void
		{
			this.$emit('open', this.buttonNode());
		},
	},
	template: `
		<div
			v-if="item.previewable"
			class="disk-picker-preview-button"
			:title="label"
			@click.stop="handleOpen"
			@dblclick.stop
		>
			<UiButton
				:text="label"
				:size="ButtonSize.SMALL"
				:style="onAccent ? AirButtonStyle.PLAIN : AirButtonStyle.PLAIN_NO_ACCENT"
				:left-icon="Outline.ZOOM_IN"
				collapsed
				:dataset="{ testid: buttonTestId }"
			/>
		</div>
	`,
});
