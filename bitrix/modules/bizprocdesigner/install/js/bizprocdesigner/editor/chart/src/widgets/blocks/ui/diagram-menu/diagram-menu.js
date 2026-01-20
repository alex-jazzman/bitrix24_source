import { Outline, Main } from 'ui.icon-set.api.core';
import { AirButtonStyle } from 'ui.vue3.components.button';
import type { MenuOptions } from 'ui.vue3.components.menu';
import { MenuButton } from '../../../../shared/ui';

// @vue/component
export const DiagramMenu = {
	name: 'DiagramMenu',
	components: {
		MenuButton,
	},
	setup(): {...}
	{
		return {
			AirButtonStyle,
		};
	},
	methods: {
		loc(locString: string): string
		{
			return this.$bitrix.Loc.getMessage(locString);
		},
		getDiagramMenu(): MenuOptions
		{
			return {
				items: [
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
	`,
};
