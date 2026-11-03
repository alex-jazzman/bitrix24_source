import { mapState } from 'ui.vue3.pinia';
import {
	AppLayout as AppLayoutEntity,
	useAppStore,
} from '../../../../entities/app';
import { useCatalogStore } from '../../../../entities/catalog';
import { useDataViewDefinitionStore } from '../../../../features/data-view-editor';
import { useProcessDataStore } from '../../../../features/process-data';

// @vue/component
export const AppLayout = {
	name: 'AppLayoutWidget',
	components: {
		AppLayoutEntity,
	},
	props: {
		hideWorkspacePanels: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		...mapState(useAppStore, [
			'isShownRightPanel',
			'isShownPreviewPanel',
			'isShownDebugBar',
			'isDataInspectorPanelShown',
		]),
		...mapState(useCatalogStore, [
			'isExpandedCatalog',
		]),
		...mapState(useDataViewDefinitionStore, {
			isTableSettingsPanelShown: 'isOpen',
		}),
		...mapState(useProcessDataStore, {
			isProcessDataPanelShown: 'isOpen',
		}),
	},
	template: `
		<AppLayoutEntity
			:showSettings="!hideWorkspacePanels && isShownRightPanel"
			:showPreviewPanel="!hideWorkspacePanels && isShownPreviewPanel"
			:showDebugBar="!hideWorkspacePanels && isShownDebugBar"
			:catalogExpanded="!hideWorkspacePanels && isExpandedCatalog"
			:isDataInspectorPanelShown="!hideWorkspacePanels && isDataInspectorPanelShown"
			:isTableSettingsPanelShown="!hideWorkspacePanels && isTableSettingsPanelShown"
			:isProcessDataPanelShown="!hideWorkspacePanels && isProcessDataPanelShown"
			:mountWorkspacePanels="!hideWorkspacePanels"
		>
			<template #skeleton>
				<slot name="skeleton" />
			</template>

			<template #header>
				<slot name="header"/>
			</template>

			<template #diagram>
				<slot name="diagram"/>
			</template>

			<template #notes-layer>
				<slot name="notes-layer"/>
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

			<template #settings-data-inspector>
				<slot name="settings-data-inspector"/>
			</template>

			<template #settings-table-settings>
				<slot name="settings-table-settings"/>
			</template>

			<template #settings-process-data>
				<slot name="settings-process-data"/>
			</template>

		</AppLayoutEntity>
	`,
};
