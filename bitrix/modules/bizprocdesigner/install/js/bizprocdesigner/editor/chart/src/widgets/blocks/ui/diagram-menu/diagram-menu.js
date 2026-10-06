import { Runtime } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle } from 'ui.vue3.components.button';
import { type MenuOptions } from 'ui.vue3.components.menu';

import { FeatureCode } from 'bizprocdesigner.feature';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useVersionHistoryStore } from '../../../../entities/blocks/stores/version-history';
import { VersionHistoryDialog } from '../../../../features/blocks/ui/version-history-dialog/version-history-dialog';
import { useFeature } from '../../../../shared/composables';
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
		isVersionHistoryAvailable(): boolean
		{
			return useFeature().isFeatureAvailable(FeatureCode.versionHistory);
		},
	},
	methods: {
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
			const versionNumber = useVersionHistoryStore()
				.versions
				.find((version) => version.id === versionId)
				?.versionNumber ?? null
			;

			this.closeVersionHistory();
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
						onClick: () => this.openStorageList(),
					},
					...(this.isVersionHistoryAvailable ? [{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_VERSION_HISTORY'),
						icon: Outline.CLOCK_BACK,
						onClick: () => this.openVersionHistory(),
					}] : []),
					{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_MARKET'),
						icon: Outline.MARKET,
						design: 'disabled',
						disabled: true,
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
		/>
		<VersionHistoryDialog
			v-if="isVersionHistoryShown"
			@close="closeVersionHistory"
			@view="viewVersion"
			@restore="restoreVersion"
		/>
	`,
};
