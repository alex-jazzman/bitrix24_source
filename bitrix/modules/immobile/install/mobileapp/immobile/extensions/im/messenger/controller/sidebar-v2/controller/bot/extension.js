/**
 * @module im/messenger/controller/sidebar-v2/controller/bot
 */
jn.define('im/messenger/controller/sidebar-v2/controller/bot', (require, exports, module) => {
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { SidebarBaseController } = require('im/messenger/controller/sidebar-v2/controller/base');
	const { BotSidebarView } = require('im/messenger/controller/sidebar-v2/controller/bot/src/view');
	const { SidebarLinksTab } = require('im/messenger/controller/sidebar-v2/tabs/links');
	const { SidebarFilesTab } = require('im/messenger/controller/sidebar-v2/tabs/files');
	const { SidebarAudioTab } = require('im/messenger/controller/sidebar-v2/tabs/audio');
	const { SidebarMediaTab } = require('im/messenger/controller/sidebar-v2/tabs/media');
	const { SidebarParticipantsTab } = require('im/messenger/controller/sidebar-v2/tabs/participants');
	const {
		SidebarContextMenuActionId,
		SidebarContextMenuActionPosition,
	} = require('im/messenger/controller/sidebar-v2/const');
	const { Icon } = require('assets/icons');
	const { onAddParticipants } = require('im/messenger/controller/sidebar-v2/user-actions/participants');
	const { createSearchButton } = require('im/messenger/controller/sidebar-v2/ui/primary-button/factory');

	class BotSidebarController extends SidebarBaseController
	{
		createView(defaultProps)
		{
			return new BotSidebarView(defaultProps);
		}

		getWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_CHAT_TITLE');
		}

		// region context menu

		getHeaderContextMenuItems()
		{
			return [
				...super.getHeaderContextMenuItems(),
				{
					id: SidebarContextMenuActionId.ADD_PARTICIPANTS,
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_ADD_PARTICIPANTS'),
					icon: Icon.ADD_PERSON,
					testId: 'sidebar-context-menu-add-participants',
					sort: SidebarContextMenuActionPosition.MIDDLE,
					onItemSelected: () => {
						onAddParticipants({
							dialogId: this.dialogId,
							store: this.store,
						}).catch((error) => {
							this.logger.log(`${this.constructor.name}.onAddParticipants`, error);
						});
					},
				},
			];
		}

		// endregion

		// region primary actions

		/**
		 * @return {SidebarPrimaryActionButton[]}
		 */
		getPrimaryActionButtons()
		{
			return [
				createSearchButton({
					onClick: () => this.handleSearchAction(),
				}),
			];
		}

		// endregion

		// region tabs

		createTabs()
		{
			const props = this.getTabsProps();

			if (this.dialogHelper.isAiAssistant)
			{
				return [
					new SidebarParticipantsTab(props),
					new SidebarLinksTab(props),
				];
			}

			return [
				new SidebarParticipantsTab(props),
				new SidebarMediaTab(props),
				new SidebarFilesTab(props),
				new SidebarLinksTab(props),
				new SidebarAudioTab(props),
			];
		}

		// endregion
	}

	module.exports = {
		BotSidebarController,
		ControllerClass: BotSidebarController,
	};
});
