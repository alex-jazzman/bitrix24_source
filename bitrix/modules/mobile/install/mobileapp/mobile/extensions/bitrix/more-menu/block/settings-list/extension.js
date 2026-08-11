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

	const SectionId = {
		MAIN: 'settings',
		EXTRA: 'additional',
	};

	const ItemId = {
		GENERAL: 'settings',
		PRESETS: 'bottom_menu',
		SECURITY: 'security',
		NOTIFICATIONS: 'notifications',
		CHANGE_PORTAL: 'change_portal',
		GO_TO_WEB: 'go_to_web',
		LOGOUT: 'exit',
	};

	const SETTINGS_SECTIONS = [
		{
			id: SectionId.MAIN,
			code: SectionId.MAIN,
			sort: 800,
			hidden: false,
			title: Loc.getMessage('MENU_SETTINGS_SETTINGS_SECTION_TITLE'),
			items: [
				{
					id: ItemId.GENERAL,
					imageName: Icon.SETTINGS.getName(),
					title: Loc.getMessage('MENU_SETTINGS_SECTION_SETTINGS_MSGVER_1'),
					sort: 100,
					path: '/settings/general',
					params: {
						analytics: {
							tool: 'settings',
							category: 'general_settings',
							event: 'start_page',
							c_section: 'ava_menu',
						},
					},
				},
				{
					id: ItemId.PRESETS,
					imageName: Icon.BOTTOM_MENU.getName(),
					title: Loc.getMessage('MENU_SETTINGS_SECTION_BOTTOM_MENU'),
					sort: 200,
					path: '/settings/tab.presets',
					params: {
						counter: 'menu_tab_presets',
						analytics: {
							tool: 'settings',
							category: 'tab_preset_settings',
							event: 'start_page',
							c_section: 'ava_menu',
						},
					},
				},
				{
					id: ItemId.SECURITY,
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
					id: ItemId.NOTIFICATIONS,
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
			id: SectionId.EXTRA,
			code: SectionId.EXTRA,
			sort: 900,
			hidden: false,
			items: [
				{
					id: ItemId.CHANGE_PORTAL,
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
					id: ItemId.GO_TO_WEB,
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
					id: ItemId.LOGOUT,
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
				structure: getUpdateSectionsWithCounters(this.prepareMenuItems(), counters),
				onItemClick: handleItemClick,
				shouldShowSectionTitle: false,
			});
		}

		/**
		 * Builds a fresh sections structure with per-instance visibility applied.
		 * Does not mutate the shared SETTINGS_SECTIONS singleton.
		 * @return {object[]}
		 */
		prepareMenuItems()
		{
			const canUseSecuritySettings = this.props.canUseSecuritySettings ?? false;
			const canUseTabPresetSettings = this.props.canUseTabPresetSettings ?? true;
			const canUseNotificationSettings = this.props.canUseNotificationSettings ?? true;
			const canGoToWeb = this.props.canGoToWeb ?? true;

			const hideItems = {
				[ItemId.SECURITY]: !canUseSecuritySettings,
				[ItemId.PRESETS]: !canUseTabPresetSettings,
				[ItemId.NOTIFICATIONS]: !canUseNotificationSettings,
				[ItemId.GO_TO_WEB]: !canGoToWeb,
			};

			return SETTINGS_SECTIONS.map((section) => ({
				...section,
				items: section?.items?.map((item) => ({
					...item,
					hidden: Boolean(hideItems[item?.id]),
				})),
			}));
		}
	}

	module.exports = { SettingsList, SETTINGS_SECTIONS };
});
