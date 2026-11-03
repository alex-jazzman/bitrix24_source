import { Loc } from 'main.core';
import { BLine } from 'ui.system.skeleton.vue';
import { defineComponent } from 'ui.vue3';

import { type ProcessDataUsage } from 'bizprocdesigner.editor.chart';

const SKELETON_LINES = [0, 1, 2];

export const ElementUsages = defineComponent({
	name: 'BizprocDesignerProcessDataElementUsages',
	components: {
		BLine,
	},
	props: {
		usages: {
			type: Array,
			default: (): ProcessDataUsage[] => [],
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		loadingText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_USAGES_LOADING') ?? '';
		},
		emptyText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_USAGES_EMPTY') ?? '';
		},
		skeletonLines: (): number[] => SKELETON_LINES,
	},
	template: `
		<div class="bizprocdesigner-process-data-usages" data-testid="bizprocdesigner-process-data-usages">
			<div
				v-if="isLoading"
				class="bizprocdesigner-process-data-usages__skeleton"
				role="status"
				:aria-label="loadingText"
				aria-busy="true"
				data-testid="bizprocdesigner-process-data-usages-skeleton"
			>
				<BLine v-for="line in skeletonLines" :key="line"/>
			</div>
			<p
				v-else-if="usages.length === 0"
				class="bizprocdesigner-process-data-usages__empty"
				data-testid="bizprocdesigner-process-data-usages-empty"
			>
				{{ emptyText }}
			</p>
			<ul v-else class="bizprocdesigner-process-data-usages__items">
				<li
					v-for="usage in usages"
					:key="usage.activityName"
					class="bizprocdesigner-process-data-usages__item"
					:data-testid="'bizprocdesigner-process-data-usage-' + usage.activityName"
				>
					{{ usage.title }}
				</li>
			</ul>
		</div>
	`,
});
