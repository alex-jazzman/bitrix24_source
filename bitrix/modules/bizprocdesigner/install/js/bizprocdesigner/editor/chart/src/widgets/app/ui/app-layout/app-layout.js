import { mapState } from 'ui.vue3.pinia';
import {
	AppLayout as AppLayoutEntity,
	useAppStore,
} from '../../../../entities/app';
import { useCatalogStore } from '../../../../entities/catalog';

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
			'isShownDebugBar',
		]),
		...mapState(useCatalogStore, [
			'isExpandedCatalog',
		]),
	},
	template: `
		<AppLayoutEntity
			:showSettings="isShownRightPanel"
			:showPreviewPanel="isShownPreviewPanel"
			:showDebugBar="isShownDebugBar"
			:catalogExpanded="isExpandedCatalog"
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

			<template #debug-bar-toolbar>
				<slot name="debug-bar-toolbar"/>
			</template>

			<template #top-middle-anchor>
				<slot name="top-middle-anchor"/>
			</template>

			<template #settings>
				<slot name="settings"/>
			</template>
		</AppLayoutEntity>
	`,
};
