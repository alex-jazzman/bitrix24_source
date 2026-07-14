/**
 * @module im/messenger/controller/sidebar-v2/tabs/participants/src/menu/project
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/participants/src/menu/project', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { confirmDefaultAction } = require('alert');
	const { Feature } = require('im/messenger/lib/feature');
	const { ParticipantsGroupMenu } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/menu/group');

	/**
	 * @class ParticipantsProjectMenu
	 */
	class ParticipantsProjectMenu extends ParticipantsGroupMenu
	{
		removeAction()
		{
			return {
				...super.removeAction(),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_MENU_ITEM_LIST_REMOVE_FROM_PROJECT'),
			};
		}

		leaveAction()
		{
			return {
				...super.leaveAction(),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_MENU_ITEM_LIST_COLLAB_LEAVE'),
			};
		}

		showRemoveConfirm()
		{
			if (!Feature.isNestedChatAvailable)
			{
				return super.showRemoveConfirm();
			}

			return new Promise((resolve) => {
				confirmDefaultAction({
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_CONFIRM_REMOVE_TITLE_PROJECT'),
					description: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_CONFIRM_REMOVE_DESCRIPTION_PROJECT'),
					actionButtonText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_CONFIRM_REMOVE_YES'),
					onAction: resolve,
				});
			});
		}
	}

	module.exports = {
		ParticipantsProjectMenu,
	};
});
