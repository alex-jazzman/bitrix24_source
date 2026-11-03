import { BLine } from 'ui.system.skeleton.vue';
import { defineComponent } from 'ui.vue3';

import './item-row-skeleton.css';

// One row of the list while it loads: the icon's square and a line where the name will be.
// It repeats the geometry of the real row down to the pixel — height, inset, corner and the
// gap below — so the list does not jump when the rows it stands for arrive.
//
// The placeholders are white rather than grey, and the way to ask for that is the context: the
// design system's skeleton paints itself from --ui-color-base-6, which is a grey step in the
// light context and translucent white in the edge-dark one. The context class is the public
// way to switch it — the skeleton exposes no colour of its own, and its internal classes are
// not ours to override.
export const ItemRowSkeleton = defineComponent({
	name: 'DiskPickerItemRowSkeleton',
	components: {
		BLine,
	},
	props: {
		width: {
			type: Number,
			default: 220,
		},
	},
	template: `
		<div class="disk-picker-item-row-skeleton --ui-context-edge-dark" aria-hidden="true">
			<BLine :width="24" :height="24" :radius="6"/>
			<BLine :width="width" :height="10" :radius="4"/>
		</div>
	`,
});
