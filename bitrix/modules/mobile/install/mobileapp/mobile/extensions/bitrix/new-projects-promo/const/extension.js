/**
 * @module new-projects-promo/const
 */
jn.define('new-projects-promo/const', (require, exports, module) => {
	const COMPONENT_NAME = 'new-projects-promo';
	const TRIGGER_EVENT = 'NewProjectsPromo::trigger';
	const MOUNTED_EVENT = 'NewProjectsPromo::mounted';
	const BACKGROUND_UI_MANAGER_CLOSE_EVENT = 'BackgroundUIManager::onCloseActiveComponent';
	const PRIORITY = 100;

	module.exports = {
		COMPONENT_NAME,
		TRIGGER_EVENT,
		MOUNTED_EVENT,
		BACKGROUND_UI_MANAGER_CLOSE_EVENT,
		PRIORITY,
	};
});
