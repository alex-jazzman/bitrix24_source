(() => {
	const require = (extension) => jn.require(extension);
	const { NewProjectsPromoCoordinator } = require('new-projects-promo/coordinator');
	const {
		TRIGGER_EVENT,
		MOUNTED_EVENT,
		BACKGROUND_UI_MANAGER_CLOSE_EVENT,
	} = require('new-projects-promo/const');

	const coordinator = new NewProjectsPromoCoordinator();

	BX.addCustomEvent(TRIGGER_EVENT, () => {
		void coordinator.onTrigger();
	});
	BX.addCustomEvent(MOUNTED_EVENT, () => {
		coordinator.onMounted();
	});
	BX.addCustomEvent(BACKGROUND_UI_MANAGER_CLOSE_EVENT, () => {
		coordinator.onCloseActiveComponent();
	});
})();
