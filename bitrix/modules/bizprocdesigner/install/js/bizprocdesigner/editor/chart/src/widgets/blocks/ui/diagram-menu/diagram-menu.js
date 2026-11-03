import { Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle } from 'ui.vue3.components.button';
import { type MenuOptions } from 'ui.vue3.components.menu';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { FeatureCode } from 'bizprocdesigner.feature';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useVersionHistoryStore } from '../../../../entities/blocks/stores/version-history';
import { VersionHistoryDialog } from '../../../../features/blocks/ui/version-history-dialog/version-history-dialog';
import { PROCESS_DATA_EVENTS } from '../../../../features/process-data';
import { useFeature, isTemplateEditLockAvailable } from '../../../../shared/composables';
import { FRAGMENT_LIBRARY_EVENTS } from '../../../../shared/constants';
import { useToastStore } from '../../../../shared/stores';
import { MenuButton } from '../../../../shared/ui';
import { showVersionRestoreDialog } from '../version-view-bar/version-view-bar';

// @vue/component
export const DiagramMenu = {
	name: 'DiagramMenu',
	components: {
		MenuButton,
		VersionHistoryDialog,
	},
	setup(): {...}
	{
		return {
			AirButtonStyle,
		};
	},
	data(): Object
	{
		return {
			isVersionHistoryShown: false,
		};
	},
	computed: {
		...mapState(
			useDiagramStore,
			[
				'canOfferTemplateTakeover',
				'canRestoreVersion',
				'isPublishing',
				'isTemplateTakeoverInProgress',
			],
		),
		isVersionHistoryAvailable(): boolean
		{
			return useFeature().isFeatureAvailable(FeatureCode.versionHistory);
		},
		isProcessDataAvailable(): boolean
		{
			return useFeature().isFeatureAvailable(FeatureCode.processData);
		},
		isFragmentLibraryAvailable(): boolean
		{
			return useFeature().isFeatureAvailable(FeatureCode.componentLibrary);
		},
		// The second entry into the move of the overlay, offered on the same condition as its centre and
		// through the very same reading of it: two entries into one action are not allowed to differ in
		// what they propose. The feature flag stays its own — it puts out the item entirely, not only the
		// action behind it.
		isReleaseTemplateAvailable(): boolean
		{
			return isTemplateEditLockAvailable() && this.canOfferTemplateTakeover;
		},
	},
	methods: {
		...mapActions(useDiagramStore, ['takeOverTemplate']),
		loc(locString: string): string
		{
			return this.$bitrix.Loc.getMessage(locString);
		},
		openStorageList(): void
		{
			Runtime.loadExtension('bizproc.router').then(({ Router }) => {
				Router.openStorageList();
			}).catch((e) => console.error(e));
		},
		openProcessData(): void
		{
			EventEmitter.emit(PROCESS_DATA_EVENTS.OPEN, {});
		},
		// Opened without a place to add to: this way in knows no point on the canvas, and the insertion
		// picks one itself.
		openFragmentLibrary(): void
		{
			EventEmitter.emit(FRAGMENT_LIBRARY_EVENTS.OPEN, {});
		},
		openVersionHistory(): void
		{
			this.isVersionHistoryShown = true;
		},
		closeVersionHistory(): void
		{
			this.isVersionHistoryShown = false;
		},
		viewVersion(versionId: number): void
		{
			this.closeVersionHistory();
			void useDiagramStore().viewVersion(versionId);
		},
		restoreVersion(versionId: number): void
		{
			this.closeVersionHistory();

			// Viewing a version stays open to a session that may not write, and the restore offered next to
			// it does not: the store refuses it. A confirmation asked before that refusal promises what will
			// not happen, so the reason is said instead.
			if (!this.canRestoreVersion)
			{
				useToastStore().addWarning(this.loc('BIZPROCDESIGNER_EDITOR_VERSION_RESTORE_UNAVAILABLE_TOAST'));

				return;
			}

			const versionNumber = useVersionHistoryStore()
				.versions
				.find((version) => version.id === versionId)
				?.versionNumber ?? null
			;

			showVersionRestoreDialog(versionNumber, () => {
				void useDiagramStore().restoreVersion(versionId);
			});
		},
		getDiagramMenu(): MenuOptions
		{
			return {
				items: [
					{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_STORAGE_LIST'),
						icon: Outline.DATABASE,
						dataset: { testid: 'bizprocdesigner-editor-menu-storage-list' },
						onClick: () => this.openStorageList(),
					},
					...(this.isProcessDataAvailable ? [{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_PROCESS_DATA'),
						icon: Outline.DATA_READING,
						dataset: { testid: 'bizprocdesigner-process-data-menu-item' },
						onClick: () => this.openProcessData(),
					}] : []),
					...(this.isFragmentLibraryAvailable ? [{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_FRAGMENT_LIBRARY'),
						icon: Outline.LIBRARY_BASE,
						dataset: { testid: 'bizprocdesigner-editor-menu-fragment-library' },
						onClick: () => this.openFragmentLibrary(),
					}] : []),
					...(this.isVersionHistoryAvailable ? [{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_HISTORY'),
						icon: Outline.CLOCK_BACK,
						dataset: { testid: 'bizprocdesigner-editor-menu-version-history' },
						onClick: () => this.openVersionHistory(),
					}] : []),
					...(this.isReleaseTemplateAvailable ? [{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_RELEASE_TEMPLATE'),
						icon: Outline.UNLOCK_M,
						// A publication in flight takes the lease on the server, so the move would wait
						// for it anyway: an item that reads as available while nothing happens for the
						// length of a heavy request looks broken instead of busy.
						disabled: this.isTemplateTakeoverInProgress || this.isPublishing,
						dataset: { testid: 'bizprocdesigner-editor-menu-release-template' },
						onClick: () => {
							void this.takeOverTemplate();
						},
					}] : []),
					{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_MARKET'),
						icon: Outline.MARKET,
						design: 'disabled',
						disabled: true,
						dataset: { testid: 'bizprocdesigner-editor-menu-market' },
						badgeText: 'Скоро',
						// uiButtonOptions: {
						// 	disabled: true,
						// },
					},
					// {
					// 	title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_IMPORT_EXPORT'),
					// 	icon: Main.EXPAND,
					// 	onClick: () => alert(this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_IMPORT_EXPORT')),
					// },
				],
			};
		},
	},
	template: `
		<MenuButton
			:buttonStyle="AirButtonStyle.OUTLINE_ACCENT_2"
			:text="loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_BUTTON')"
			:options="getDiagramMenu()"
			:dataset="{ testid: 'bizprocdesigner-editor-menu-button' }"
		/>
		<VersionHistoryDialog
			v-if="isVersionHistoryShown"
			@close="closeVersionHistory"
			@view="viewVersion"
			@restore="restoreVersion"
		/>
	`,
};
