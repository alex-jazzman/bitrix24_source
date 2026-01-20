/**
 * @module more-menu/block/settings-list
 */
jn.define('more-menu/block/settings-list', (require, exports, module) => {
	const { List } = require('more-menu/ui/list');
	const { Loc } = require('loc');
	const {
		handleItemClick,
		getUpdateSectionsWithCounters,
	} = require('more-menu/utils');
	const { Icon } = require('assets/icons');
	const { PureComponent } = require('layout/pure-component');

	const SETTINGS_SECTIONS = [
		{
			id: 'settings',
			code: 'settings',
			sort: 800,
			hidden: false,
			title: Loc.getMessage('MENU_SETTINGS_SETTINGS_SECTION_TITLE'),
			items: [
				{
					id: 'settings',
					imageName: Icon.SETTINGS.getName(),
					title: Loc.getMessage('MENU_SETTINGS_SECTION_SETTINGS_MSGVER_1'),
					sort: 100,
					path: '/settings/general',
					params: {
						analytics: {
							tool: 'settings',
							category: 'settings',
							event: 'switch_account',
							c_section: 'ava_menu',
						},
					},
				},
				{
					id: 'bottom_menu',
					imageName: Icon.BOTTOM_MENU.getName(),
					title: Loc.getMessage('MENU_SETTINGS_SECTION_BOTTOM_MENU'),
					sort: 200,
					path: '/settings/tab.presets',
					params: {
						counter: 'menu_tab_presets',
					},
				},
				{
					id: 'security',
					imageName: Icon.SHIELD.getName(),
					title: Loc.getMessage('MENU_SETTINGS_SECTION_SECURITY'),
					sort: 150,
					path: '/settings/security',
					params: {
						analytics: {
							tool: 'settings',
							category: 'security_settings',
							event: 'start_page',
							c_section: 'ava_menu',
						},
					},
				},
				{
					id: 'notifications',
					imageName: Icon.NOTIFICATION.getName(),
					title: Loc.getMessage('MENU_SETTINGS_SECTION_NOTIFICATIONS'),
					sort: 300,
					path: '/settings/notifications',
					params: {
						analytics: {
							tool: 'settings',
							category: 'notification_settings',
							event: 'start_page',
							c_section: 'ava_menu',
						},
					},
				},
			],
		},
		{
			id: 'additional',
			code: 'additional',
			sort: 900,
			hidden: false,
			items: [
				{
					id: 'change_portal',
					imageName: 'change_order',
					title: Loc.getMessage('MENU_BITRIX24_SECTION_CHANGE_PORTAL'),
					sort: 100,
					path: '/change-portal/',
					params: {
						analytics: {
							tool: 'intranet',
							category: 'activation',
							event: 'switch_account',
							c_section: 'ava_menu',
						},
					},
				},
				{
					id: 'go_to_web',
					imageName: Icon.GO_TO.getName(),
					title: Loc.getMessage('MENU_SETTINGS_SECTION_GO_TO_WEB'),
					sort: 200,
					path: '/settings/go-to-web',
					params: {
						title: Loc.getMessage('MENU_SETTINGS_SECTION_GO_TO_WEB_COMPONENT_TITLE'),
						hintText: Loc.getMessage('MENU_SETTINGS_SECTION_GO_TO_WEB_COMPONENT_HINT_TEXT'),
						analyticsSection: 'menu',
					},
				},
				{
					id: 'exit',
					imageName: 'log_out',
					title: Loc.getMessage('MENU_BITRIX24_SECTION_EXIT'),
					sort: 300,
					path: '/change-portal/',
					mode: 'alert',
					params: {
						analytics: {
							tool: 'intranet',
							category: 'activation',
							event: 'switch_account',
							c_section: 'ava_menu',
						},
					},
				},
			],
		},
	];

	/**
	 * @class SettingsList
	 */
	class SettingsList extends PureComponent
	{
		render()
		{
			const { counters, testId } = this.props;

			return new List({
				testId: testId || 'more-menu-settings-list',
				structure: getUpdateSectionsWithCounters(this.prepareSettingsList(), counters),
				onItemClick: handleItemClick,
				shouldShowSectionTitle: false,
			});
		}

		prepareSettingsList()
		{
			const canUseSecuritySettings = this.props.canUseSecuritySettings ?? false;
			const preparedSections = SETTINGS_SECTIONS;

			if (!canUseSecuritySettings)
			{
				const settingsSection = preparedSections.find((section) => section.id === 'settings');
				const securityItem = settingsSection?.items?.find((item) => item.id === 'security');
				if (securityItem)
				{
					securityItem.hidden = true;
				}
			}

			return preparedSections;
		}
	}

	module.exports = { SettingsList, SETTINGS_SECTIONS };
});
