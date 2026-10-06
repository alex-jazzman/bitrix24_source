import { BLine, BCircle } from 'ui.system.skeleton.vue';

import { PickerLayout } from '../picker-layout/picker-layout';

import './loading-skeleton.css';

// @vue/component
export const LoadingSkeleton = {
	name: 'DiskPickerLoadingSkeleton',
	components: {
		PickerLayout,
		BLine,
		BCircle,
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
				<div class="disk-picker-skeleton__sidebar-row">
					<BCircle :size="24"/>
					<BLine :width="sidebarWidths[0]" :height="10" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__sidebar-row">
					<BCircle :size="24"/>
					<BLine :width="sidebarWidths[1]" :height="10" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<div
					v-for="width in sidebarWidths.slice(2)"
					class="disk-picker-skeleton__sidebar-row"
				>
					<BCircle :size="24"/>
					<BLine :width="width" :height="10" :radius="4"/>
				</div>
			</template>

			<template #header>
				<BLine :width="120" :height="16" :radius="4"/>
				<div class="disk-picker-skeleton__header-actions">
					<BLine :width="34" :height="34" :radius="8"/>
					<BLine :width="68" :height="34" :radius="8"/>
				</div>
			</template>

			<template #list>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="72" :height="8" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__list-rows">
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
				<div class="disk-picker-skeleton__preview">
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
				<BLine :width="84" :height="38" :radius="8"/>
				<BLine :width="120" :height="38" :radius="8"/>
			</template>
		</PickerLayout>
	`,
};
