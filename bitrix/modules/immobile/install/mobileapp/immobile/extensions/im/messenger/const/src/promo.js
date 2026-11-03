/**
 * @module im/messenger/const/promo
 */
jn.define('im/messenger/const/promo', (require, exports, module) => {
	const Promo = {
		tasksRecent: 'immobile:tasks-recent-list:18112025:mobile',
		copilotSidebarEngine: 'im:chat-sidebar-change-copilot-engine-and-role:20052025:all',
		// the app's own record: viewing the web tour does not spend it
		folderAllOnboarding: 'immobile:folder-all-onboarding:12082026:mobile',
	};

	const PromoType = {
		widget: 'widget',
		spotlight: 'spotlight',
	};

	module.exports = { Promo, PromoType };
});
