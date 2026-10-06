import { defineComponent, PropType } from 'ui.vue3';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';
import { Text, Loc, Type } from 'main.core';
import { type MenuItemOptions, MenuManager } from 'main.popup';

import { type SettingButton, type SettingButtonId } from '../../types';

type SettingsMenuOnclick = (
	event?: MouseEvent,
	menuItem?: { setText: (text: string) => void },
) => Object;

const SETTING_BUTTON_ID = {
	CHOOSE_NEW_SCRIPT: 'choose-new-script',
	ANALYTICS: 'analytics',
	DELIMITER: 'delimiter',
	SHARE_SLIDER: 'share-slider',
	HOW_IT_WORKS: 'how-it-works',
} as const;

export const Settings = defineComponent({
	name: 'Settings',

	components: {
		Button,
	},

	props: {
		buttons: {
			type: Array as PropType<SettingButton[]>,
			required: true,
		},
		shareLink: {
			type: String,
			default: null,
		},
	},

	emits: ['chooseNewScript'],

	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonIcon,
			ButtonSize,
		};
	},

	data(): { settingsMenuId: string }
	{
		return {
			settingsMenuId: `crm-ai-report-drawer-settings-menu-${Text.getRandom()}`,
		};
	},

	methods: {
		closeSettingsMenu(): void
		{
			MenuManager.getMenuById(this.settingsMenuId)?.close();
		},

		openSettings(): Object
		{
			const existingMenu = MenuManager.getMenuById(this.settingsMenuId);
			if (existingMenu)
			{
				const popupWindow = existingMenu.getPopupWindow();
				if (popupWindow?.isShown())
				{
					existingMenu.close();
				}
				else
				{
					existingMenu.show();
				}

				return {};
			}

			const menu = MenuManager.create({
				id: this.settingsMenuId,
				bindElement: this.$refs.container as HTMLElement,
				className: 'crm-ai-report-drawer-settings-menu ui-icon-set__scope',
				autoHide: true,
				closeByEsc: true,
				angle: false,
				cacheable: true,
				navigationOptions: {
					initialFocusPosition: 'first',
				},
				events: {
					onClose: () => {
						this.resetShareSliderText();
					},
				},
				items: this.getSettingsMenuItems(),
			});

			menu.show();

			return {};
		},

		getSettingsMenuItems(): MenuItemOptions[]
		{
			const items: MenuItemOptions[] = [];

			this.buttons.forEach((button) => {
				const menuItem = this.getSettingButton(button);
				if (!Type.isNull(menuItem))
				{
					items.push(menuItem);
				}
			});

			return items;
		},

		executeOnClick(jsCode: string): Object
		{
			this.closeSettingsMenu();

			(new Function(jsCode))();

			return {};
		},

		getSettingMenuItemData(id: SettingButtonId): null | { messageCode: string, className: string }
		{
			const baseClassName = 'crm-ai-report-drawer-settings-item';

			switch (id)
			{
				case SETTING_BUTTON_ID.CHOOSE_NEW_SCRIPT:
					return {
						messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_RESELECT_SCRIPT',
						className: `${baseClassName} ${baseClassName}--choose-new-script`,
					};

				case SETTING_BUTTON_ID.ANALYTICS:
					return {
						messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_ANALYTICS',
						className: `${baseClassName} ${baseClassName}--analytics`,
					};

				case SETTING_BUTTON_ID.SHARE_SLIDER:
					return {
						messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_SHARE_SLIDER',
						className: `${baseClassName} ${baseClassName}--share-slider`,
					};

				case SETTING_BUTTON_ID.HOW_IT_WORKS:
					return {
						messageCode: 'CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_HOW_IT_WORKS',
						className: `${baseClassName} ${baseClassName}--how-it-works`,
					};

				default:
					return null;
			}
		},

		createSettingMenuItem(button: SettingButton, onclick: SettingsMenuOnclick): null | MenuItemOptions
		{
			const settingMenuItemData = this.getSettingMenuItemData(button.id);
			if (!settingMenuItemData)
			{
				return null;
			}

			const text = Loc.getMessage(settingMenuItemData.messageCode) ?? '';
			if (!Type.isStringFilled(text))
			{
				return null;
			}

			return {
				text,
				onclick,
				id: button.id,
				delimiter: false,
				className: settingMenuItemData.className,
				attrs: {},
			};
		},

		resetShareSliderText(): void
		{
			MenuManager.getMenuById(this.settingsMenuId)
				?.getMenuItem(SETTING_BUTTON_ID.SHARE_SLIDER)
				?.setText(Loc.getMessage('CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_SHARE_SLIDER') ?? '');
		},

		markShareSliderAsCopied(menuItem?: { setText: (text: string) => void }): void
		{
			const copiedText = Loc.getMessage('CRM_AI_REPORT_DRAWER_SETTINGS_ITEM_SHARE_SLIDER_COPIED');
			if (!Type.isStringFilled(copiedText))
			{
				return;
			}

			menuItem?.setText(copiedText);
		},

		async copyShareLink(link: string): Promise<boolean>
		{
			if (window.isSecureContext && navigator.clipboard?.writeText)
			{
				try
				{
					await navigator.clipboard.writeText(link);

					return true;
				}
				catch
				{
				}
			}

			return this.copyShareLinkWithDocument(link);
		},

		// Fallback for browsers/envs that don't support navigator.clipboard.writeText
		copyShareLinkWithDocument(link: string): boolean
		{
			const textarea = document.createElement('textarea');
			textarea.value = link;
			textarea.setAttribute('readonly', '');
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			textarea.style.pointerEvents = 'none';

			document.body.append(textarea);
			textarea.select();

			try
			{
				return document.execCommand('copy');
			}
			catch
			{
				return false;
			}
			finally
			{
				textarea.remove();
			}
		},

		async handleShareSliderClick(
			event?: MouseEvent,
			menuItem?: { setText: (text: string) => void },
		): Promise<Object>
		{
			if (!Type.isStringFilled(this.shareLink))
			{
				return {};
			}

			const isCopied = await this.copyShareLink(this.shareLink);
			if (isCopied)
			{
				this.markShareSliderAsCopied(menuItem);
			}

			return {};
		},

		getSettingButton(button: SettingButton): null | MenuItemOptions
		{
			if (button.id === SETTING_BUTTON_ID.DELIMITER)
			{
				return {
					delimiter: true,
					attrs: {},
				};
			}

			if (button.id === SETTING_BUTTON_ID.CHOOSE_NEW_SCRIPT)
			{
				return this.createSettingMenuItem(button, () => {
					this.closeSettingsMenu();
					this.$emit('chooseNewScript', this.$refs.container as HTMLElement);

					return {};
				});
			}

			if (button.id === SETTING_BUTTON_ID.SHARE_SLIDER)
			{
				return this.createSettingMenuItem(
					button,
					(event?: MouseEvent, menuItem?: { setText: (text: string) => void }) => {
						void this.handleShareSliderClick(event, menuItem);

						return {};
					},
				);
			}

			if (!Type.isStringFilled(button.onclick))
			{
				return null;
			}

			return this.createSettingMenuItem(button, () => this.executeOnClick(button.onclick as string));
		},
	},

	beforeUnmount(): void
	{
		MenuManager.destroy(this.settingsMenuId);
	},

	template: `
		<div ref="container" class="crm-ai-report-drawer__settings">
			<Button
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:size="ButtonSize.SMALL"
				:collapsedIcon="ButtonIcon.DOTS"
				@click="openSettings"
			/>
		</div>
	`,
});
