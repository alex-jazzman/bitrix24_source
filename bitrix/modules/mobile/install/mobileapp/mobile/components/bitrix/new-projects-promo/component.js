(() => {
	const require = (extension) => jn.require(extension);
	const {
		MOUNTED_EVENT,
		BACKGROUND_UI_MANAGER_CLOSE_EVENT,
	} = require('new-projects-promo/const');
	const { markViewed } = require('new-projects-promo/state');
	const { NewProjectsPromo } = require('new-projects-promo/view');

	BX.onViewLoaded(() => {
		let isManagerCloseNotified = false;
		/** @type {() => void} */
		const notifyManagerClose = () => {
			if (isManagerCloseNotified)
			{
				return;
			}

			isManagerCloseNotified = true;
			BX.postComponentEvent(BACKGROUND_UI_MANAGER_CLOSE_EVENT, []);
		};

		layout.setListener(
			/**
			 * @param {string} eventName
			 * @return {void}
			 */
			(eventName) => {
				if (eventName === 'onViewHidden')
				{
					notifyManagerClose();
				}
			},
		);

		try
		{
			layout.showComponent(NewProjectsPromo({
				onClose: () => layout.close(),
			}));
		}
		catch (error)
		{
			console.error('NewProjectsPromo.showComponent:', error);
			notifyManagerClose();

			return;
		}

		markViewed();
		BX.postComponentEvent(MOUNTED_EVENT, [], 'background');
	});
})();
