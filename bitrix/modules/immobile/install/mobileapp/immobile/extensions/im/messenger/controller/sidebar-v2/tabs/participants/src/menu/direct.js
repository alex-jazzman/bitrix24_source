/**
 * @module im/messenger/controller/sidebar-v2/tabs/participants/src/menu/direct
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/participants/src/menu/direct', (require, exports, module) => {
	const { ParticipantsBaseMenu } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/menu/base');

	/**
	 * @class ParticipantsDirectMenu
	 */
	class ParticipantsDirectMenu extends ParticipantsBaseMenu
	{
		getActionItems()
		{
			return [
				this.isTargetCurrentUser() && this.notesAction(),
			];
		}

		shouldShowMenu()
		{
			return this.isTargetCurrentUser() && super.shouldShowMenu();
		}
	}

	module.exports = {
		ParticipantsDirectMenu,
	};
});
