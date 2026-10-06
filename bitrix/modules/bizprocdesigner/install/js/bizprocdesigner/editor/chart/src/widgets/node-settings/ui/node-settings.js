import { Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { useHistory } from 'ui.block-diagram';
import { MessageBox } from 'ui.dialogs.messagebox';
import { type MenuItemOptions } from 'ui.vue3.components.menu';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { useAppStore } from '../../../entities/app';
import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import { NodeSettingsLayout, useNodeSettingsStore, EVENT_NAMES, getPortsSignature } from '../../../entities/node-settings';
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
	makeSnapshot: () => void;
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
		const { makeSnapshot } = useHistory();

		return {
			getMessage,
			getBackgroundImage,
			blockMediator: new BlockMediator(),
			makeSnapshot,
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['documentType', 'blocks', 'isWriteLocked']),
		...mapState(useNodeSettingsStore, [
			'isLoading',
			'isShown',
			'block',
			'nodeSettings',
			'ports',
			'isResolvingActionPrefill',
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
			'syncRelation',
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
		saveRules(): Array<Promise<void>>
		{
			const rulesIds = [...this.nodeSettings.rules.keys()];

			return Promise.all(rulesIds.map((ruleId) => this.saveRule(ruleId, this.documentType)));
		},
		syncRelations(): void
		{
			const relationsIds = [...this.nodeSettings.relations.keys()];
			relationsIds.forEach((relationId) => this.syncRelation(relationId));
		},
		async saveSettings(): Promise<void>
		{
			const { waitForCatalog, getDefaultTitle } = useDefaultTitle();
			await waitForCatalog();
			const activityData = await this.saveForm(
				this.documentType,
				getDefaultTitle(this.block.activity, this.block.node?.defaultTitle),
			);
			// Only after the server accepted the node (relations included): syncRelation() deletes
			// relation ports and schema connections and refreshes the saved-state snapshot, so running
			// it before a save that may still fail would leave the diagram without a rollback.
			this.syncRelations();
			this.updateBlockActivityField(this.block.id, activityData);
			const prevBlock = this.blocks.find((block) => block.id === this.block.id);
			const prevPortsSignature = getPortsSignature(prevBlock?.ports);
			this.setPorts(this.block.id, this.ports);
			await this.publicDraft();
			if (getPortsSignature(this.ports) !== prevPortsSignature)
			{
				this.makeSnapshot();
			}
		},
		async onSave(): Promise<void>
		{
			// Settings travel to the server on their own action, outside the draft write the store
			// guards, so the lock is checked here and not only by hiding the button.
			if (this.isWriteLocked)
			{
				return;
			}

			// An action being added is still resolving what it inherits: saving now would persist the
			// rules without it and close the panel, and the insertion landing afterwards would be
			// rejected by its own context check — the user would see a successful save and lose the
			// action silently. The dimmed button is out of neither the mouse's nor the keyboard's
			// reach (aria-disabled keeps it live), so the press is answered instead of ignored.
			if (this.isResolvingActionPrefill)
			{
				LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_PENDING_ANNOUNCE'));

				return;
			}

			this.isSaving = true;
			try
			{
				// A subscribed "Create" form returns true from its BEFORE_SUBMIT handler when it still has empty
				// required fields (already flagged inline). Block the save so an invalid node is not persisted;
				// the inline errors explain why, so no extra alert is raised.
				const validations = await EventEmitter.emitAsync(EVENT_NAMES.BEFORE_SUBMIT_EVENT);
				if (Array.isArray(validations) && validations.some(Boolean))
				{
					throw { required: true };
				}

				await this.saveRules();
				await this.saveSettings();
				this.hideSettings();
			}
			catch (error)
			{
				// The required-fields case is already flagged inline; everything else must be voiced,
				// including plain Error instances that carry no server error collection.
				if (error?.required !== true)
				{
					const message = error?.errors?.[0]?.message
						?? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE_ERROR');
					MessageBox.alert(Text.encode(message));
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
					v-if="!isWriteLocked"
					:isSaving="isSaving"
					:isDisabled="isResolvingActionPrefill"
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
