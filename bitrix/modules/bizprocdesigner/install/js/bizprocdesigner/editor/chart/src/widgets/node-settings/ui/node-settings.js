import { Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MessageBox } from 'ui.dialogs.messagebox';
import { type MenuItemOptions } from 'ui.vue3.components.menu';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { useAppStore } from '../../../entities/app';
import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import { NodeSettingsLayout, useNodeSettingsStore, EVENT_NAMES } from '../../../entities/node-settings';
import { useLoc } from '../../../shared/composables';
import { NODE_SETTINGS_TABS } from '../../../shared/constants';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';
import { EditorChartTabs, SaveSettingsButton, CancelSettingsButton } from '../../../shared/ui';
import { getBackgroundImage } from '../../../shared/utils';
import { BlockMediator } from '../../blocks/lib';
import { BasicNodeSettings } from './basic-node-settings';
import { NodeSettingsRules } from './node-settings-rules';
import { useDefaultTitle } from '../../../features/catalog';
type NodeSettingsSetup = {
	getMessage: () => string;
	getBackgroundImage: () => string;
	blockMediator: BlockMediator;
};

// @vue/component
export const NodeSettings = {
	name: 'NodeSettings',
	components: {
		BasicNodeSettings,
		NodeSettingsRules,
		EditorChartTabs,
		SaveSettingsButton,
		CancelSettingsButton,
		NodeSettingsLayout,
	},
	setup(): NodeSettingsSetup
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			getBackgroundImage,
			blockMediator: new BlockMediator(),
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['documentType']),
		...mapState(useNodeSettingsStore, [
			'isLoading',
			'isShown',
			'block',
			'nodeSettings',
			'ports',
		]),
		...mapWritableState(useNodeSettingsStore, ['isSaving', 'selectedTabId']),
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
							content: BasicNodeSettings,
						},
					],
					[
						NODE_SETTINGS_TABS.rules,
						{
							id: NODE_SETTINGS_TABS.rules,
							title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_RULES'),
							content: NodeSettingsRules,
						},
					],
				],
			);
		},
	},
	methods:
	{
		...mapActions(useAppStore, [
			'hideRightPanel',
		]),
		...mapActions(useNodeSettingsStore, [
			'discardFormSettings',
			'toggleVisibility',
			'reset',
			'saveRule',
			'saveForm',
			'saveRelation',
		]),
		...mapActions(useNodeDataInspectorStore, ['resetDataInspector']),
		...mapActions(useDiagramStore, [
			'updateBlockActivityField',
			'setPorts',
			'publicDraft',
		]),
		hideSettings(): void
		{
			this.hideRightPanel();
			this.toggleVisibility(false);
			this.reset();
			this.resetDataInspector();
		},
		onClose(): void
		{
			this.discardFormSettings();
			this.hideSettings();
		},
		async saveRules(): Array<Promise<void>>
		{
			await EventEmitter.emitAsync(EVENT_NAMES.BEFORE_SUBMIT_EVENT);
			const rulesIds = [...this.nodeSettings.rules.keys()];

			return Promise.all(rulesIds.map((ruleId) => this.saveRule(ruleId, this.documentType)));
		},
		saveRelations(): Array<Promise<void>>
		{
			const relationsIds = [...this.nodeSettings.relations.keys()];

			return Promise.all(relationsIds.map((relationId) => this.saveRelation(relationId)));
		},
		async saveSettings(): Promise<void>
		{
			const { waitForCatalog, getDefaultTitle } = useDefaultTitle();
			await waitForCatalog();
			const activityData = await this.saveForm(this.documentType, getDefaultTitle(this.block.activity));
			this.updateBlockActivityField(this.block.id, activityData);
			this.setPorts(this.block.id, this.ports);
			await this.publicDraft();
		},
		async onSave(): Promise<void>
		{
			this.isSaving = true;
			try
			{
				await Promise.all([
					this.saveRules(),
					this.saveRelations(),
				]);
				await this.saveSettings();
				this.hideSettings();
			}
			catch (error)
			{
				if (error.errors?.[0]?.message)
				{
					MessageBox.alert(Text.encode(error.errors[0].message));
				}
			}
			finally
			{
				this.isSaving = false;
			}
		},
	},
	template: `
		<NodeSettingsLayout
			:isLoading="isLoading"
			:isSaving="isSaving"
			:isShown="isShown"
			@close="onClose"
		>
			<template #header>
				<slot
					name="header"
					:block="block"
					:title="nodeSettings?.title"
					:moreMenuItems="moreMenuItems"
					:onDeletedBlock="onClose"
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

			<template #content>
				<KeepAlive>
					<component
						:is="tabs.get(this.selectedTabId).content"
					/>
				</KeepALive>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeSettingsSave')"
					@click="onSave"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeSettingsDiscard')"
					@click="onClose"
				/>
			</template>
		</NodeSettingsLayout>
	`,
};
