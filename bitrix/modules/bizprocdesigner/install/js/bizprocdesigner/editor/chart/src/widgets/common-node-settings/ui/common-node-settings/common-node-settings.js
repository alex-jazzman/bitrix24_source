import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { EditorChartTabs } from '../../../../shared/ui';
import { NODE_SETTINGS_TABS } from '../../../../shared/constants';
import { useLoc } from '../../../../shared/composables';

import {
	CommonNodeSettingsForm,
	CommonNodeSettingsPreview,
	useCommonNodeSettingsStore,
} from '../../../../entities/common-node-settings';
import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useAppStore } from '../../../../entities/app';
import { useDefaultTitle } from '../../../../features/catalog';
import { BlockMediator } from '../../../blocks/lib';

import { type MenuItemOptions } from 'ui.vue3.components.menu';

const ACTIVITY_NAME = 'SetupTemplateActivity';

// @vue/components
export const CommonNodeSettings = {
	name: 'CommonNodeSettings',
	components: {
		CommonNodeSettingsForm,
		CommonNodeSettingsPreview,
		EditorChartTabs,
	},
	setup(): { getMessage: () => string, blockMediator: BlockMediator, getDefaultTitle: Function; }
	{
		const { getMessage } = useLoc();
		const { getDefaultTitle } = useDefaultTitle();

		return { getMessage, blockMediator: new BlockMediator(), getDefaultTitle };
	},
	computed: {
		...mapState(useCommonNodeSettingsStore, [
			'isVisible',
			'block',
		]),
		...mapWritableState(useCommonNodeSettingsStore, ['selectedTabId']),
		...mapState(useDiagramStore, [
			'documentType',
		]),
		...mapState(useAppStore, [
			'isShownRightPanel',
		]),
		isSetupTemplateActivity(): boolean
		{
			return this.block.activity.Type === ACTIVITY_NAME;
		},
		defaultTitle(): string
		{
			return this.block ? this.getDefaultTitle(this.block.activity) : '';
		},
		moreMenuItems(): Array<MenuItemOptions>
		{
			return this.block ? this.blockMediator.getSettingsBlockMenuOptions(this.block) : [];
		},
		tabs(): Map
		{
			return new Map(
				[
					[
						NODE_SETTINGS_TABS.basic,
						{
							id: NODE_SETTINGS_TABS.basic,
							title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_BASIC'),
						},
					],
					[
						NODE_SETTINGS_TABS.rules,
						{
							id: NODE_SETTINGS_TABS.rules,
							title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_RULES'),
						},
					],
				],
			);
		},
	},
	methods: {
		...mapActions(useAppStore, ['hideRightPanel', 'setShowPreviewPanel']),
		...mapActions(useCommonNodeSettingsStore, [
			'hideSettings',
		]),
		onCloseSettings(): void
		{
			this.hideSettings();
			this.hideRightPanel();
		},
		onShowRules(): void
		{
			this.selectedTabId = NODE_SETTINGS_TABS.rules;
		},
	},
	template: `
		<CommonNodeSettingsForm
			v-if="isVisible"
			:block="block"
			:documentType="documentType"
			:panelAlreadyOpened="isShownRightPanel"
			:isSetupTemplateActivity="isSetupTemplateActivity"
			:selectedTabId="selectedTabId"
			:defaultTitle="defaultTitle"
			@close="onCloseSettings"
			@showPreview="setShowPreviewPanel"
		>
			<template #header>
				<slot
					name="header"
					:block="block"
					:moreMenuItems="moreMenuItems"
					:onDeletedBlock="onCloseSettings"
				/>
			</template>

			<template #tabs>
				<EditorChartTabs
					v-model="selectedTabId"
					:tabs="tabs"
				/>
			</template>

			<template #data-inspector-toggle>
				<slot name="data-inspector-toggle" />
			</template>

			<template #common-node-settings-preview="{ title }">
				<CommonNodeSettingsPreview
					:title="title"
					@showRules="onShowRules"
				/>
			</template>
		</CommonNodeSettingsForm>
	`,
};
