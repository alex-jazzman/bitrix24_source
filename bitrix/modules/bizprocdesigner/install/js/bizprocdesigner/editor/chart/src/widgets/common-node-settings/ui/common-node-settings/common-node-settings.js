import { Event } from 'main.core';
import { isKeyboardBusyByOverlay, useBlockDiagram, KEY_TOKEN } from 'ui.block-diagram';
import { type Ref } from 'ui.vue3';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { EditorChartTabs } from '../../../../shared/ui';
import { NODE_SETTINGS_TABS } from '../../../../shared/constants';
import { useLoc } from '../../../../shared/composables';
import { isEditableElement } from '../../../../shared/utils';
import { releaseFocusFromSettings } from '../../../../shared/utils/focus-rescue';

import {
	CommonNodeSettingsForm,
	CommonNodeSettingsPreview,
	useCommonNodeSettingsStore,
} from '../../../../entities/common-node-settings';
import { diagramStore as useDiagramStore, isContentBlockPlaceholder } from '../../../../entities/blocks';
import { useAppStore } from '../../../../entities/app';
import { useCatalogStore } from '../../../../entities/catalog';
import { useDefaultTitle } from '../../../../features/catalog';
import { useDataViewDefinitionStore } from '../../../../features/data-view-editor';
import { BlockMediator } from '../../../blocks/lib';

import { type MenuItemOptions } from 'ui.vue3.components.menu';

const ACTIVITY_NAME = 'SetupTemplateActivity';

// `InputState` of `ui.block-diagram` is not exported, so what the panel takes of it is named here.
type ExclusiveKeyInputState = {
	onExclusive: (combo: string | Array<string>, handler: (event: KeyboardEvent) => void) => () => void,
};

// @vue/components
export const CommonNodeSettings = {
	name: 'CommonNodeSettings',
	components: {
		CommonNodeSettingsForm,
		CommonNodeSettingsPreview,
		EditorChartTabs,
	},
	setup(): {
		getMessage: () => string,
		blockMediator: BlockMediator,
		getDefaultTitle: Function,
		inputState: ExclusiveKeyInputState,
		blockElMap: Map<string, HTMLElement>,
		blockDiagramRef: Ref<?HTMLElement>,
	}
	{
		const { getMessage } = useLoc();
		const { getDefaultTitle } = useDefaultTitle();
		const { inputState, blockElMap, blockDiagramRef } = useBlockDiagram();

		return {
			getMessage,
			blockMediator: new BlockMediator(),
			getDefaultTitle,
			inputState,
			blockElMap,
			blockDiagramRef,
		};
	},
	created(): void
	{
		// Kept off `data`: neither the claim nor the focus answer is display state.
		this.escapeClaim = null;
		this.isFieldFocused = isEditableElement(document.activeElement);
	},
	mounted(): void
	{
		Event.bind(document, 'focusin', this.onFocusChanged);
		Event.bind(document, 'focusout', this.onFocusChanged);
		this.syncEscapeClaim();
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'focusin', this.onFocusChanged);
		Event.unbind(document, 'focusout', this.onFocusChanged);
		this.releaseEscapeClaim();
	},
	watch: {
		isVisible(): void
		{
			this.syncEscapeClaim();
		},
		isDataViewEditorOpen(): void
		{
			this.syncEscapeClaim();
		},
	},
	computed: {
		...mapState(useDataViewDefinitionStore, { isDataViewEditorOpen: 'isOpen' }),
		...mapState(useCommonNodeSettingsStore, [
			'isVisible',
			'block',
		]),
		...mapWritableState(useCommonNodeSettingsStore, ['selectedTabId']),
		...mapState(useDiagramStore, [
			'documentType',
			'contentBlockScope',
		]),
		...mapState(useCatalogStore, [
			'contentBlockProducers',
			'contentBlockConsumers',
		]),
		...mapState(useAppStore, [
			'isShownRightPanel',
		]),
		isSetupTemplateActivity(): boolean
		{
			return this.block.activity.Type === ACTIVITY_NAME;
		},
		// The form hands over the representation stored on the block, while the canvas resolves the same
		// one through the scope of the diagram. Telling one from the other is the job of the place of
		// use: the row itself gets the answer as a property and never goes for the stores.
		hasPlaceholderContentBlock(): boolean
		{
			return Boolean(this.block) && isContentBlockPlaceholder(
				this.block,
				this.contentBlockScope,
				this.contentBlockProducers,
				this.contentBlockConsumers,
			);
		},
		defaultTitle(): string
		{
			return this.block ? this.getDefaultTitle(this.block.activity, this.block.node?.defaultTitle) : '';
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
		// Every way out of the panel goes through here, so the cross and Escape leave the keyboard in
		// the same place: on the node the panel was about.
		onCloseSettings(): void
		{
			this.returnFocusToCanvas();
			this.hideSettings();
			this.hideRightPanel();
		},
		returnFocusToCanvas(): void
		{
			const blockElement = this.blockElMap?.get(this.block?.id) ?? null;

			releaseFocusFromSettings([blockElement, this.blockDiagramRef]);
		},
		onShowRules(): void
		{
			this.selectedTabId = NODE_SETTINGS_TABS.rules;
		},
		// Escape repeats the cross of this branch one for one, and a popup over the panel closes
		// first.
		onEscapeCloseSettings(): void
		{
			if (isKeyboardBusyByOverlay())
			{
				return;
			}

			this.onCloseSettings();
		},
		// Escape typed in a field belongs to the field, and the exclusive channel would take it
		// away from there too. The data view editor window is a modal of its own and is unknown to
		// `isKeyboardBusyByOverlay()`, so the claim is given up for as long as it stands open.
		syncEscapeClaim(): void
		{
			if (this.isVisible && !this.isFieldFocused && !this.isDataViewEditorOpen)
			{
				this.claimEscape();

				return;
			}

			this.releaseEscapeClaim();
		},
		// `focusout` names where the focus goes next, `focusin` where it landed; see `catalog.js`.
		onFocusChanged(event: FocusEvent): void
		{
			this.isFieldFocused = isEditableElement(
				event.type === 'focusout' ? event.relatedTarget : event.target,
			);
			this.syncEscapeClaim();
		},
		claimEscape(): void
		{
			if (this.escapeClaim === null)
			{
				this.escapeClaim = this.inputState.onExclusive(
					KEY_TOKEN.ESCAPE,
					this.onEscapeCloseSettings,
				);
			}
		},
		releaseEscapeClaim(): void
		{
			this.escapeClaim?.();
			this.escapeClaim = null;
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

			<template #common-node-settings-preview="{ title, contentBlock }">
				<CommonNodeSettingsPreview
					:title="title"
					:contentBlock="contentBlock"
					:isContentBlockPlaceholder="hasPlaceholderContentBlock"
					@showRules="onShowRules"
				/>
			</template>
		</CommonNodeSettingsForm>
	`,
};
