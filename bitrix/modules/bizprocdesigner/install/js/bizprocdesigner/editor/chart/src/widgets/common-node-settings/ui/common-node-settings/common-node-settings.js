import { mapState, mapActions } from 'ui.vue3.pinia';
import {
	CommonNodeSettingsForm,
	useCommonNodeSettingsStore,
} from '../../../../entities/common-node-settings';
import {
	diagramStore as useDiagramStore,
	BlockIcon,
} from '../../../../entities/blocks';
import { useAppStore } from '../../../../entities/app';

// @vue/components
export const CommonNodeSettings = {
	name: 'CommonNodeSettings',
	components: {
		CommonNodeSettingsForm,
		BlockIcon,
	},
	computed: {
		...mapState(useCommonNodeSettingsStore, [
			'isVisible',
			'block',
		]),
		...mapState(useDiagramStore, [
			'documentType',
		]),
	},
	methods: {
		...mapActions(useAppStore, ['hideRightPanel', 'setShowPreviewPanel']),
		...mapActions(useCommonNodeSettingsStore, ['hideSettings']),
		onCloseSettings(): void
		{
			this.hideSettings();
			this.hideRightPanel();
		},
	},
	template: `
		<CommonNodeSettingsForm
			v-if="isVisible"
			:block="block"
			:documentType="documentType"
			@close="onCloseSettings"
			@showPreview="setShowPreviewPanel"
		>
			<template #header-icon>
				<BlockIcon
					:iconName="block?.node?.icon"
					:iconColorIndex="block?.node?.colorIndex"
				/>
			</template>
		</CommonNodeSettingsForm>
	`,
};
