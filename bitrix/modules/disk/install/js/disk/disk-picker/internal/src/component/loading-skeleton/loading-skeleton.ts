import { BLine, BCircle } from 'ui.system.skeleton.vue';

import { PickerLayout } from '../picker-layout/picker-layout';
import { SourceRowSkeleton } from '../source-row-skeleton/source-row-skeleton';

import './loading-skeleton.css';

// The dialog while its first stage is on the way. Every placeholder outside the sources panel
// carries the edge-dark context: the design system's skeleton takes its fill from
// --ui-color-base-6, a grey step in the light context and translucent white in the dark one,
// and it offers no colour of its own. The panel is in that context already.
// @vue/component
export const LoadingSkeleton = {
	name: 'DiskPickerLoadingSkeleton',
	components: {
		PickerLayout,
		BLine,
		BCircle,
		SourceRowSkeleton,
	},
	setup(): Object
	{
		return {
			sidebarWidths: [120, 130, 126, 110, 122],
			listWidths: [330, 360, 300, 340, 310],
			previewWidths: [240, 172, 115],
		};
	},
	template: `
		<PickerLayout class="disk-picker-skeleton">
			<template #sidebar>
				<SourceRowSkeleton :width="sidebarWidths[0]"/>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<SourceRowSkeleton :width="sidebarWidths[1]"/>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<SourceRowSkeleton
					v-for="width in sidebarWidths.slice(2)"
					:width="width"
				/>
			</template>

			<template #header>
				<span class="--ui-context-edge-dark">
					<BLine :width="120" :height="16" :radius="4"/>
				</span>
				<div class="disk-picker-skeleton__header-actions --ui-context-edge-dark">
					<BLine :width="34" :height="34" :radius="8"/>
					<BLine :width="68" :height="34" :radius="8"/>
				</div>
			</template>

			<template #list>
				<div class="disk-picker-skeleton__group-title --ui-context-edge-dark">
					<BLine :width="72" :height="8" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__list-rows --ui-context-edge-dark">
					<div
						v-for="width in listWidths"
						class="disk-picker-skeleton__list-row"
					>
						<BCircle :size="24"/>
						<BLine :width="width" :height="10" :radius="4"/>
					</div>
				</div>
			</template>

			<template #preview>
				<div class="disk-picker-skeleton__preview --ui-context-edge-dark">
					<BLine :width="120" :height="120" :radius="16"/>
					<div class="disk-picker-skeleton__preview-lines">
						<BLine
							v-for="width in previewWidths"
							:width="width"
							:height="12"
							:radius="4"
						/>
					</div>
				</div>
			</template>

			<template #footer>
				<div class="disk-picker-skeleton__footer-actions --ui-context-edge-dark">
					<BLine :width="84" :height="38" :radius="8"/>
					<BLine :width="120" :height="38" :radius="8"/>
				</div>
			</template>
		</PickerLayout>
	`,
};
