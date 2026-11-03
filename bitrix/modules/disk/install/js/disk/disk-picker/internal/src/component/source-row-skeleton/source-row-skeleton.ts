import { BCircle, BLine } from 'ui.system.skeleton.vue';
import { defineComponent } from 'ui.vue3';

import './source-row-skeleton.css';

// The reusable visual primitive for one disk: avatar plus title only.
export const SourceRowSkeleton = defineComponent({
	name: 'DiskPickerSourceRowSkeleton',
	components: {
		BCircle,
		BLine,
	},
	props: {
		width: {
			type: Number,
			default: 120,
		},
	},
	template: `
		<div class="disk-picker-source-row-skeleton" aria-hidden="true">
			<BCircle :size="24"/>
			<span class="disk-picker-source-row-skeleton__line">
				<BLine :width="width" :height="10" :radius="4"/>
			</span>
		</div>
	`,
});
