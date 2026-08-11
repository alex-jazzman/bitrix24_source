import { BIcon } from 'ui.icon-set.api.vue';
import { ImageAlignLeftIcon, ImageAlignCenterIcon, ImageAlignRightIcon } from '../ui/icons';

// Shared resize handles + align/replace overlay pill, used by both image and video node views.
export const MediaResizeControls = {
	components: {
		ImageAlignLeftIcon,
		ImageAlignCenterIcon,
		ImageAlignRightIcon,
		BIcon,
	},
	props: {
		showHandles: { type: Boolean, default: false },
		showOverlay: { type: Boolean, default: false },
		overlayStyle: { type: Object, default: () => ({}) },
		align: { type: String, default: 'center' },
		alignTitles: { type: Object, default: () => ({}) },
		onStartResize: { type: Function, default: null },
		onSetAlign: { type: Function, default: null },
		// null = no replace button (video); function = show replace button (image)
		onReplace: { type: Function, default: null },
		replaceTitle: { type: String, default: '' },
	},
	// language=Vue
	template: `
		<span
			v-if="showHandles"
			class="note-editor-media-resize-handle note-editor-media-resize-handle--left"
			@pointerdown="onStartResize('left', $event)"
		></span>
		<span
			v-if="showHandles"
			class="note-editor-media-resize-handle note-editor-media-resize-handle--right"
			@pointerdown="onStartResize('right', $event)"
		></span>
		<div
			v-if="showOverlay"
			class="note-editor-media-overlay"
			:style="overlayStyle"
			contenteditable="false"
			@mousedown.prevent
		>
			<button
				type="button"
				class="note-editor-media-overlay-btn"
				:class="{ 'note-editor-media-overlay-btn--active': align === 'left' }"
				:title="alignTitles.left"
				@click="onSetAlign('left')"
			>
				<ImageAlignLeftIcon/>
			</button>
			<button
				type="button"
				class="note-editor-media-overlay-btn"
				:class="{ 'note-editor-media-overlay-btn--active': align === 'center' }"
				:title="alignTitles.center"
				@click="onSetAlign('center')"
			>
				<ImageAlignCenterIcon/>
			</button>
			<button
				type="button"
				class="note-editor-media-overlay-btn"
				:class="{ 'note-editor-media-overlay-btn--active': align === 'right' }"
				:title="alignTitles.right"
				@click="onSetAlign('right')"
			>
				<ImageAlignRightIcon/>
			</button>
			<span v-if="onReplace" class="note-editor-media-overlay-divider"></span>
			<button
				v-if="onReplace"
				type="button"
				class="note-editor-media-overlay-btn"
				:title="replaceTitle"
				@click="onReplace()"
			>
				<BIcon name="o-change-order" :size="24"/>
			</button>
		</div>
	`,
};
