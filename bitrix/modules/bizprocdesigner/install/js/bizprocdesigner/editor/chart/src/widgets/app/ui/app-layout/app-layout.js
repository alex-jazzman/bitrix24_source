import { mapState } from 'ui.vue3.pinia';
import {
	AppLayout as AppLayoutEntity,
	useAppStore,
} from '../../../../entities/app';

// @vue/component
export const AppLayout = {
	name: 'AppLayoutWidget',
	components: {
		AppLayoutEntity,
	},
	computed: {
		...mapState(useAppStore, [
			'isShownRightPanel',
			'isShownPreviewPanel',
		]),
	},
	template: `
		<AppLayoutEntity
			:showSettings="isShownRightPanel"
			:showPreviewPanel="isShownPreviewPanel"
		>
			<template #header>
				<slot name="header"/>
			</template>

			<template #diagram>
				<slot name="diagram"/>
			</template>

			<template #catalog>
				<slot name="catalog"/>
			</template>

			<template #top-right-toolbar>
				<slot name="top-right-toolbar"/>
			</template>

			<template #bottom-right-toolbar>
				<slot name="bottom-right-toolbar"/>
			</template>

			<template #settings>
				<slot name="settings"/>
			</template>
		</AppLayoutEntity>
	`,
};
