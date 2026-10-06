import { Outline } from 'ui.icon-set.api.core';
import { type MenuOptions } from 'ui.vue3.components.menu';
import { mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { EditTemplateName } from '../../../../features/blocks';
import { EditTemplateSettingsDialog } from '../../../../features/blocks/ui/edit-template-settings-dialog/edit-template-settings-dialog';

const SECTION_CODE = 'space';

// @vue/component
export const TemplateName = {
	name: 'TemplateName',
	components:
	{
		EditTemplateName,
		EditTemplateSettingsDialog,
	},
	data(): Object
	{
		return {
			isPopupShown: false,
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['isWriteLocked']),
	},
	watch:
	{
		isWriteLocked(isWriteLocked: boolean): void
		{
			if (isWriteLocked)
			{
				this.isPopupShown = false;
			}
		},
	},
	methods:
	{
		loc(locString: string): string
		{
			return this.$bitrix.Loc.getMessage(locString);
		},
		getMenuItems(): MenuOptions
		{
			return {
				sections: [
					{
						code: SECTION_CODE,
					},
				],
				items: [
					{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_SETTINGS'),
						icon: Outline.SETTINGS,
						onClick: this.onOpenSettingsPopup,
					},
					// {
					// 	title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_OPEN'),
					// 	icon: Outline.BULLETED_LIST,
					// 	sectionCode: SECTION_CODE,
					// 	onClick: () => alert(this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_OPEN')),
					// },
					// {
					// 	title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_CREATE'),
					// 	icon: Outline.PLUS_M,
					// 	sectionCode: SECTION_CODE,
					// 	onClick: () => alert(this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_CREATE')),
					// },
				],
			};
		},
		onOpenSettingsPopup(): void
		{
			if (this.isWriteLocked)
			{
				return;
			}

			this.isPopupShown = true;
		},
		onCloseSettingsPopup(): void
		{
			this.isPopupShown = false;
		},
	},
	template: `
		<EditTemplateName :dropdownOptions="getMenuItems()"/>
		<EditTemplateSettingsDialog
			v-if="isPopupShown"
			@close="onCloseSettingsPopup"
		/>
	`,
};
